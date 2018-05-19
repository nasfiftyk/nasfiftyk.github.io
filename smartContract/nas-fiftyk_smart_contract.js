"use strict";

var DictItem = function(text) {
	if (text) {
		var obj = JSON.parse(text);
		this.fileName = obj.fileName;
		this.md5 = obj.md5;
		this.from = obj.from;
		this.base64 = obj.base64;

	} else {
		this.fileName = "";
		this.md5 = "";
		this.from = "";
		this.base64 = "";
	}
};



DictItem.prototype = {
	toString: function () {
		return JSON.stringify(this);
	}
};

var NasFiftyK = function () {
	LocalContractStorage.defineMapProperty(this, "storage", {
		parse: function (text) {
			return new DictItem(text);
		},
		stringify: function (o) {
			return o.toString();
		}
	});

	LocalContractStorage.defineMapProperty(this, "arrayMap");

	LocalContractStorage.defineProperty(this, "index", null)

};

NasFiftyK.prototype = {
	init: function () {
		this.index = -1;
	},

	save: function (key, value) {

		this.index += 1;

		key = key.trim();
		value = value.trim();

		if (key === "" || value === ""){
			throw new Error("empty key / value");
		}

		var filename = key.trim();
		var data = value;

		if (!data.split(";md5,")[0]) {
			throw new Error("element 0 not found");

		}
		if (!data.split(";md5,")[1]) {
			throw new Error("element 1 not found");
		}

		var md5 = data.split(";md5,")[0];
		var base64 = data.split(";md5,")[1];

		// check if file already exists by checking hashes :
		var dictItem = this.storage.get(md5);
		if (dictItem){
			throw new Error("md5 " + md5 +  " already present !");
		}

		dictItem = new DictItem();
		dictItem.from = Blockchain.transaction.from;
		dictItem.md5 = md5;
		dictItem.base64 = base64;
		dictItem.fileName = filename;

		// 'put' is equivalent operation to 'set' for values:
		this.arrayMap.put(this.index, md5);
		this.storage.put(md5, dictItem);


	},

	getFromMd5: function (md5) {
		md5 = key.trim();
		if ( md5 === "" ) {
			throw new Error("empty md5")
		}
		return this.storage.get(md5);
	},

	getFromFileName: function (fileName) {

		var resultArray = [];
		var arrayIndex = 0;
		for (var i = 0; i <= this.index; i++) {

			var md5 = this.arrayMap.get(i);
			var object = this.storage.get(md5);

			resultArray[arrayIndex] = object;
			arrayIndex += 1;

		}
		return resultArray;

	},

	_isMatching: function(object, searchField, pattern) {

		if ( searchField == "fileName") {
			return ( object.fileName == pattern )
		}
		if ( searchField == "md5") {
			return ( object.md5 == pattern )
		}
		if ( searchField == "from") {
			return ( object.from == pattern )
		}

	},

	_getStart: function (offset) {
		// compute start index value for parsing in decreasing order :
		offset = parseInt(offset);

		// check if no entries :
		if (this.index == -1) {
			return this.index;
		}

		if (offset > this.index) {
			throw new Error("offset is not valid");
		}

		var start = this.index - offset;
		if (start > this.index) {
			start = this.index;
		}
		return start;
	},

	_getEnd: function (start, limit) {
		// compute end index value for parsing in decreasing order :
		limit = parseInt(limit);

		var end = start - limit;
		if (end < 0) {
			end = 0;
		}
		return end;
	},

	searchFrom: function (searchField, pattern, limit, offset) {

		var start = this._getStart(offset);
		var end = this._getEnd(start, limit);

		var matchingResults = 0;
		// check the whole map in order to compute the number
		// of matching elements (used for table pagination) :
		for (var i = 0; i <= this.index; i++) {
			var md5 = this.arrayMap.get(i);
			var object = this.storage.get(md5);

			if ( this._isMatching(object, searchField, pattern) ) {
				matchingResults += 1;
			}

		}


		var resultArray = [];
		var arrayIndex = 0;
		// then return the mached elements corresponding to limit and offset values
		// passed by the table pagination :
		for(var i = start; i > end - 1; i--) {

			var md5 = this.arrayMap.get(i);
			var object = this.storage.get(md5);

			if ( this._isMatching(object, searchField, pattern) ) {
				resultArray[arrayIndex] = {"fileName": object.fileName,
																	 "md5": object.md5,
																	 "from": object.from,
																	 "index": i,
																	 "counter": i + 1,
																	 "entriesTot": matchingResults};

				arrayIndex += 1;
			}

		}

		return resultArray;

	},


	getFileList: function (limit, offset) {

    // Fill table data without base64 data, only data required for filling
		// table fields are retreived here in order to avoid memory consuming overhead.
		// Base64 data will be fetched asynchronously only for the
		// item to be downloaded selected by the user.
		// This operation will be performed by getFromIndex().
		var start = this._getStart(offset);
		var end = this._getEnd(start, limit);

		var resultArray = [];
		var arrayIndex = 0;

		for(var i = start; i > end - 1; i--) {

			var md5 = this.arrayMap.get(i);
			var object = this.storage.get(md5);

			resultArray[arrayIndex] = {"fileName": object.fileName,
																 "md5": object.md5,
																 "from": object.from,
																 "index": i,
																 "counter": i + 1,
																 "entriesTot": this.index + 1};
																 arrayIndex += 1;
															 	}
		return resultArray;

	},


	getFromIndex: function (index) {
		// retrieve full data of an item :
		return this.storage.get(this.arrayMap.get(index));

	},




};
module.exports = NasFiftyK;
