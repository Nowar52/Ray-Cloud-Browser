/*
 *  Ray Cloud Browser: interactively skim processed genomics data with energy
 *  Copyright (C) 2012  Sébastien Boisvert
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

#ifndef _GraphDatabase_h
#define _GraphDatabase_h

#include "VertexObject.h"
#include "constants.h"

#include <stdint.h>

#define GRAPH_FORMAT_VERSION 2345678987

/**
 * A class to search kmers in a database file.
 */
class GraphDatabase{

	char m_map[4];

	char*m_file;

	int m_format;
	int m_kmerLength;
	uint64_t m_entries;

public:
	void setDataFile(char*file);
	bool getObject(VertexObject*object,char*key);
	int getKmerLength();
	char getSymbol(int code);
};

#endif

