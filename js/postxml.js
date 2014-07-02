$g.post.url( {
	"core/core.php"		: function( post ){
		if( post.action == "user" ){

		};
	},
	"core/core1.php" 	: {
		"name|1-3"	: "xxxx",
		"age|20-80" : 10,
		"friend|0-9": {
			"name|1-5"	: "kkkj",
			"age|20-80"	: 10
		}
	},
	"core/core2.php" 	: "js/json/core.js"
} );