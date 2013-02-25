/*
 *  Ray Cloud Browser: interactively skim processed genomics data with energy
 *  Copyright (C) 2012, 2013 Sébastien Boisvert
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */



/**
 * Operate on paths
 *
 * \author Sébastien Boisvert
 */
function PathOperator(dataStore,graphOperator){
	this.dataStore=dataStore;
	this.graphOperator=graphOperator;
	this.regions=[];

	this.reset();

	this.selectedRegionIndex=0;
	this.selectedRegion=false;
	this.defineColors();
}

PathOperator.prototype.getSelectedRegion=function(){
	if(this.hasSelectedRegion())
		return this.getRegion(this.selectedRegionIndex);

	return null;
}

PathOperator.prototype.getRegions=function(){
	return this.regions;
}

PathOperator.prototype.getRegion=function(index){
	if(!(index<this.regions.length))
		return null;

	return this.regions[index];
}

PathOperator.prototype.defineColors=function(){

	this.availableColors=[];
	this.availableColors.push("rgb(80,80,255)");
	this.availableColors.push("rgb(255,80,80)");
	this.availableColors.push("rgb(80,255,80)");

	this.colorIndex=0;
}

PathOperator.prototype.allocateColor=function(){

	var color=this.availableColors[this.colorIndex++];

	this.colorIndex%=this.availableColors.length;

	return color;
}

PathOperator.prototype.hasSelectedRegion=function(){
	return this.selectedRegion;
}

PathOperator.prototype.startOnPath=function(locationData){

	this.reset();

	var color=this.allocateColor();
	var region=new Region(
			locationData["map"],locationData["mapName"],
			locationData["section"],locationData["sectionName"],
			locationData["region"],locationData["regionName"],
			locationData["location"],locationData["locationName"],
			locationData["regionLength"],
			color
			);

	this.selectedRegion=true;
	this.selectedRegionIndex=this.regions.length;
	this.regions.push(region);

	this.hasLocation=true;

	this.dataStore.clear();
	this.graphOperator.clear();

	var parameters=this.getParametersForRegion();

	var message=new Message(RAY_MESSAGE_TAG_GET_REGION_KMER_AT_LOCATION,
				this,this.dataStore,parameters);

	message.send();
}

PathOperator.prototype.getParametersForRegion=function(){
	var parameters=new Object();
	parameters["map"]=this.getSelectedRegion().getMap();
	parameters["section"]=this.getSelectedRegion().getSection();
	parameters["region"]=this.getSelectedRegion().getRegion();
	parameters["location"]=this.getSelectedRegion().getLocation();
	parameters["count"]=512;

	return parameters;
}

PathOperator.prototype.receiveAndProcessMessage=function(message){
	var tag=message.getTag();

	if(tag==RAY_MESSAGE_TAG_GET_REGION_KMER_AT_LOCATION_REPLY){

		this.active=false;

		var content=message.getContent();

		var vertices=content["vertices"]

		var i=0;
		while(i<vertices.length){

			var sequence=vertices[i]["sequence"];
			var position=vertices[i]["position"];

			this.vertexAtPosition[position]=sequence;

			if(!this.hasLeft|| position<this.lastLeft){
				this.lastLeft=position;
				this.hasLeft=true;
			}

/*
			if(position<10)
				console.log("position= "+position);
*/

			this.keys[sequence]=true;
			if(!(sequence in this.pathPositions)){
				this.pathPositions[sequence]=new Array();
			}

			var found=false;
			var iterator=0;
			while(iterator<this.pathPositions[sequence].length){
				if(this.pathPositions[sequence][iterator++]==position){
					found=true;
					break;
				}
			}

			if(!found){
				this.pathPositions[sequence].push(position);

				this.graphOperator.addPositionForVertex(sequence,position);
			}

/*
			if(this.pathPositions[sequence].length>1){
				console.log("More than 1 position for "+sequence+" with");

				for(var k in this.pathPositions[sequence])
 					console.log(" ->"+this.pathPositions[sequence][k]);
			}
*/

			if(!this.hasRight|| position>this.lastRight){
				this.lastRight=position;
				this.hasRight=true;
			}

			i++;
		}

/*
 * We only need to bootstrap the beast once.
 */
		if(this.started)
			return;

		this.started=true;

		var locationInRegion=this.getSelectedRegion().getLocation();

// pick up a middle position
		var kmerSequence=vertices[Math.floor(vertices.length/2)]["sequence"];

		var i=0;
		while(i<vertices.length){
			var sequence=vertices[i]["sequence"];
			var position=vertices[i]["position"];

			if(position==locationInRegion){
				kmerSequence=sequence;

				break;
			}

			i++;
		}

		var parameters=new Object();
		parameters["map"]=this.dataStore.getMapIndex();
		parameters["sequence"]=kmerSequence;
		parameters["count"]=this.dataStore.getDefaultDepth();

		var theMessage=new Message(RAY_MESSAGE_TAG_GET_KMER_FROM_STORE,this.dataStore,this.dataStore,parameters);
		this.dataStore.sendMessageOnTheWeb(theMessage);
	}
}

PathOperator.prototype.doReadahead=function(){

	if(this.active){
		return;
	}

	if(!(this.hasLeft && this.hasRight))
		return;

	var currentLocation=this.getSelectedRegion().getLocation();

	var position=currentLocation;

	var buffer=1024;

	if(position<this.lastLeft+buffer && this.lastLeft!=0){

		this.active=true;

		var parameters=this.getParametersForRegion();
		parameters["location"]=this.lastLeft;

		var message=new Message(RAY_MESSAGE_TAG_GET_REGION_KMER_AT_LOCATION,
				this,this.dataStore,parameters);
		message.send();

	}else if(position > this.lastRight-buffer && this.lastRight!=this.getSelectedRegion().getRegionLength()-1){

		this.active=true;

		var parameters=this.getParametersForRegion();
		parameters["location"]=this.lastRight;

		var message=new Message(RAY_MESSAGE_TAG_GET_REGION_KMER_AT_LOCATION,
				this,this.dataStore,parameters);
		message.send();
	}
}

PathOperator.prototype.isVertexInPath=function(vertex){

	if(vertex in this.keys){

		return true;
	}

	return false;
}

PathOperator.prototype.reset=function(){

	this.centered=false;
	this.active=false;

	this.keys=new Object();
	this.pathPositions=new Object();
	this.vertexAtPosition=new Object();

	this.started=false;
	this.lastLeft=0;
	this.lastRight=0;
	this.hasLeft=false;
	this.hasRight=false;

	this.hasLocation=false;
}

PathOperator.prototype.getVertexPosition=function(sequence){
	if(sequence in this.pathPositions){
		if(this.pathPositions[sequence].length==1){
			return this.pathPositions[sequence][0];
		}else{
// TODO show many coverages when there are many
			return this.pathPositions[sequence][0];
		}

	}

	return -1;
}

PathOperator.prototype.hasVertex=function(){

	if(!this.hasSelectedRegion())
		return false;

	var currentLocation=this.getSelectedRegion().getLocation();

	return currentLocation<this.getSelectedRegion().getRegionLength()&& currentLocation>=0;
}

PathOperator.prototype.setCurrentVertex=function(sequence){
	if(sequence in this.pathPositions){

		this.getSelectedRegion().setLocation(this.pathPositions[sequence][0]);
		this.hasLocation=true;
	}
}

PathOperator.prototype.getVertex=function(){
	if(!this.hasVertex)
		return null;

	var currentLocation=this.getSelectedRegion().getLocation();

	return this.vertexAtPosition[currentLocation];
}

PathOperator.prototype.next=function(){
	this.getSelectedRegion().next();
}

PathOperator.prototype.previous=function(){
	this.getSelectedRegion().previous();
}

PathOperator.prototype.getVertexPositions=function(sequence){
	if(sequence in this.pathPositions){
		return this.pathPositions[sequence];
	}

	return [];
}

PathOperator.prototype.hasCurrentLocation=function(){
	return this.hasLocation;
}

PathOperator.prototype.getCurrentLocation=function(){

	return this.getSelectedRegion().getLocation();
}

PathOperator.prototype.isCentered=function(){
	return this.centered;
}

PathOperator.prototype.setCenteredState=function(){
	this.centered=true;
}

PathOperator.prototype.selectRegion=function(index){

}
