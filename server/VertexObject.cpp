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

#include "VertexObject.h"
#include "constants.h"

#include <string.h>
#include <string>
using namespace std;

void VertexObject::setSequence(char*value){
	strcpy(m_sequence,value);

	m_parents[INDEX_A]=MARKER_NO;
	m_parents[INDEX_C]=MARKER_NO;
	m_parents[INDEX_G]=MARKER_NO;
	m_parents[INDEX_T]=MARKER_NO;

	m_children[INDEX_A]=MARKER_NO;
	m_children[INDEX_C]=MARKER_NO;
	m_children[INDEX_G]=MARKER_NO;
	m_children[INDEX_T]=MARKER_NO;
}

void VertexObject::setCoverage(uint32_t value){
	m_coverage=value;
}

uint32_t VertexObject::getCoverage(){
	return m_coverage;
}

void VertexObject::writeContentInJSON(ostream*stream){
	(*stream)<<"{"<<endl;
	(*stream)<<"	\"value\": \""<<m_sequence<<"\","<<endl;
	(*stream)<<"	\"coverage\": "<<m_coverage<<","<<endl;
	(*stream)<<"	\"parents\": [";

	bool gotFirst=false;
	for(int i=0;i<4;i++){
		if(m_parents[i]==MARKER_YES){
			if(gotFirst)
				(*stream)<<", ";
			gotFirst=true;

			(*stream)<<"\""<<getCodeSymbol(i)<<"\"";
		}
	}
	
	(*stream)<<"],"<<endl;

	(*stream)<<"	\"children\": [";

	gotFirst=false;
	for(int i=0;i<4;i++){
		if(m_children[i]==MARKER_YES){
			if(gotFirst)
				(*stream)<<", ";
			gotFirst=true;

			(*stream)<<"\""<<getCodeSymbol(i)<<"\"";
		}
	}

	(*stream)<<"]"<<endl;
	(*stream)<<"}";
}

void VertexObject::addParent(char symbol){
	m_parents[getSymbolCode(symbol)]=MARKER_YES;
}

void VertexObject::addChild(char symbol){
	m_children[getSymbolCode(symbol)]=MARKER_YES;
}

int VertexObject::getSymbolCode(char symbol){
	if(symbol==SYMBOL_A)
		return INDEX_A;
	if(symbol==SYMBOL_C)
		return INDEX_C;
	if(symbol==SYMBOL_G)
		return INDEX_G;
	if(symbol==SYMBOL_T)
		return INDEX_T;

	return INDEX_A;
}

char VertexObject::getCodeSymbol(int code){
	if(code==INDEX_A)
		return SYMBOL_A;
	if(code==INDEX_C)
		return SYMBOL_C;
	if(code==INDEX_G)
		return SYMBOL_G;
	if(code==INDEX_T)
		return SYMBOL_T;

	return SYMBOL_A;
}

void VertexObject::getSequence(string*sequence){
	*sequence=m_sequence;
}

void VertexObject::getParents(vector<string>*parents){
	string sequence=m_sequence;
	string base=sequence.substr(0,sequence.length()-1);

	for(int i=0;i<4;i++){
		if(m_parents[i]==MARKER_YES){
			char symbol=getCodeSymbol(i);
			string otherObject=symbol+base;
			parents->push_back(otherObject);
		}
	}
}

void VertexObject::getChildren(vector<string>*children){
	string sequence=m_sequence;
	string base=sequence.substr(1,sequence.length()-1);

	for(int i=0;i<4;i++){
		if(m_children[i]==MARKER_YES){
			char symbol=getCodeSymbol(i);
			string otherObject=base+symbol;
			children->push_back(otherObject);
		}
	}
}

uint64_t VertexObject::getAnnotationOffset(){
	return m_annotationOffset;
}

void VertexObject::setAnnotationOffset(uint64_t value){
	m_annotationOffset=value;
}

