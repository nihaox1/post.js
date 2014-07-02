$c.extend( {
	post 	: (function(){
		var Post,
			config,
			tool,
			manage,
			Ajax;

		Ajax = function( self , url , data , callback , options ){
			var _opt = {
					type 	: "POST",
					url		: url || self.config.url,
					data 	: data 	|| {},
					timeout : config.timeout,
					success : function( rtn ){
						var _errors = self.config.errors;
						try{	
							rtn = typeof rtn == "object" ? rtn : $.parseJSON( rtn );
						} catch( e ) {
							return E( "return value not JSON" );
						};
						for( var i = _errors.length; i--; ){
							if( typeof _errors[ i ] != "function" ){
								continue;
							};
							if( _errors[ i ]( rtn ) === false ){
								return false;
							};
						};
						if( callback ){ callback( rtn ); };
					},
					error 	: function( rtn ){
						try{ console.warn( rtn ); } catch( e ) {};
					}
				};
			_opt = $c.tool.rtn( _opt , options || {} );
			if( self.config.debug ){
				tool.debug_ajax.call( self , _opt );
			} else {
				$.ajax( _opt );
			};
		};

		Post = function( config , args ){
			var _self 	= this,
				_rtn 	= function( url , data , callback , options ){
					_self.send( url , data , callback , options );
				};
			this.config = tool.set_config.call( _self , config , args );
			_rtn.error 	= function( errors ){
				_self.error( errors );
			};
			_rtn.url 	= function( args ){
				_self.set_url( args );
			};
			return _rtn;
		};

		Post.fn = Post.prototype;

		/*!
		 *	针对ajax请求做预处理
		 *	@errors		{array}
		 *		{func}				
		 */
		Post.fn.error = function( errors ){
			if( typeof errors == "function" ){
				this.config.errors.push( errors );
			} else if( typeof errors == "array" ) {
				this.config.errors = this.config.errors.concat( errors );
			};
		};

		Post.fn.send = function( url , data , callback , options ){
			if( this.config.wait ){
				this.ajaxs.push( arguments );
			} else {
				tool.ajax.apply( this , arguments );
			};
			return this.send;
		};

		Post.fn.set_url = function( args ){
			E( args );
			this.Jurls = args;
		};

		Post.fn.ajaxs = [];
		tool = {
			/*!
			 *	debug模式下
			 *	序列化请求回调的值
			 *	主要是做随机值的填充
			 */
			get_rtn_val : function( obj ){
				var _rtn = {},
					_key;
				for( var a in obj ){
					if( /.*\|\d+-\d+/gi.test( a ) ){
						_key 		= a.split( "|" );
						_key[ 1 ] 	= _key[ 1 ].split( "-" );
						_rtn[ _key[ 0 ] ] = (function(){
							var _num = Math.floor( Math.random() * ( _key[ 1 ][ 1 ] - _key[ 1 ][ 0 ] ) + _key[ 1 ][ 0 ] );
							if( typeof obj[ a ] == "string" ){
								var _str = [];
								while( _num-- ){
									_str.push( obj[ a ] );
								};
								return _str.join( "" );
							} else if( typeof obj[ a ] == "number" ){
								return _num;
							} else if( typeof obj[ a ] == "object" ){
								var _al = [];
								while( _num-- ){
									_al.push( tool.get_rtn_val( obj[ a ] ) );
								};
								return _al;
							};
						})();
					} else {
						_rtn[ a ] = obj[ a ];
					};
				};
				return _rtn;
			},
			/*!
			 *	发现为debug模式时  将直接采用本地请求
			 *	@opts 	{object}	请求提交的ajax数据
			 */
			debug_ajax : function( opts ){
				E( arguments );
				var _val;
				if( !( _val = this.Jurls[ opts.url ] ) ){
					return E( "Post url not exsist." );
				};
				if( typeof _val == "object" ){
					opts.success( tool.get_rtn_val( _val ) );
				} else {
					return E( "Error return value." );
				};
			},
			/*!
			 *	发送ajax的参数预处理
			 *	this 将被指向到Post实例
			 */
			ajax : function( url , data , callback , options ){
				if( typeof url == "object" ){
					options 	= callback 	|| {};
					callback 	= data 		|| false;
					data 		= url;
					url 		= false;
				} else if( typeof url == "function" ){
					options 	= data;
					callback 	= url;
					data 		= {};
					url 		= false;
				} else if( typeof url != "string" ){
					return this.send;
				};
				new Ajax( this , url , data , callback , options );
			},
			/*!
			 *	设置Post实例的通配配置
			 *	并处理当其debug为true时 需求的url转向文件
			 */
			set_config : function( conf , opts ){
				var _self = this;
				conf 	= $c.tool.rtn( config , conf );
				if( conf.debug && opts ){
					if( typeof opts.url == "string" ){
						conf.wait = true;
						$c.modal.require( { 
							url 		: opts.url,
							callback 	: function(){
								conf.wait = false;
								for( var i = 0 , len = _self.ajaxs.length; i < len; i++ ){
									tool.ajax.apply( _self , _self.ajaxs[ i ] );
								};
							}
						} );
					} else if( typeof opts.url == "object" ){
						_self.set_url( opts.url );
					};
				};
				return conf;
			},
			config 	: function(){
				config = {
					url 		: 0,
					errors 		: [],
					timeout 	: 20000
				};
			}
		};

		manage = {
			global 	: function( conf ){
				if( !conf ){ 
					return config; 
				} else if( typeof conf == "string" ) {
					config.url = conf;
				} else if( typeof conf == "object" ) {
					for( var a in conf ){
						if( config.hasOwnProperty( a ) ){
							config[ a ] = conf[ a ];
						};
					};
				};
			},
			create 	: function( conf , args ){
				var _post;
				if( !conf ){ 
					return false; 
				} else if( typeof conf == "string" ){
					conf = { url : conf };
				} else if( typeof conf != "object" ){
					return false;
				};
				if( !conf.url && !config.url ){ return false; };
				return new Post( conf , args );
			}
		};
		tool.config();
		return manage;
	})()
} );