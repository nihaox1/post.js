$c.extend( {
	post 	: (function(){
		var Post,
			config,
			tool,
			manage,
			Ajax,
			Jurls;

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
				tool.debug_ajax.call( self , _opt , _opt.url );
			} else {
				$.ajax( _opt );
			};
		};

		Jurl = function( url ){
			var _self = this;
			this.config = {
				url 	: url,
				wait	: true,
				items 	: [],
				value 	: 0
			};
			$c.modal.require( {
				url 	: url
			} );
		};

		Jurl.fn = Jurl.prototype;

		Jurl.fn.config = function(){
			return this.config;
		};
		/*!
		 *	负责接收本地针对分发url的 ajax请求
		 *	@opts 	{object}	接收的ajax请求数据
		 */
		Jurl.fn.send = function( opts ){
			if( this.config.wait ){
				this.config.items.push( opts );
			} else {
				tool.debug_ajax( opts , this.config.url );
			};
		};

		/*!
		 *	对应url的返回值
		 */
		Jurl.fn.set = function( args ){
			this.config.wait 	= false;
			this.config.value 	= args;
			for( var i = 0 , len = this.config.items.length; i < len; i++ ){
				this.send( this.config.items[ i ] );
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
			_rtn.url 	= function( url , args ){
				_self.set_url( url , args );
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

		Post.fn.set_url = function( url , args ){
			if( !url ){
				return this.send;
			} else if( !args ){
				this.orgin_jurl = url;
				this.jurl = $c.tool.rtn( url );
			} else if( args ){
				this.jurls[ url ].set( args );
			};
		};

		Post.fn.ajaxs 		= [];

		Post.fn.orgin_jurl 	= {};
		Post.fn.jurls 		= {};

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
			 *	根据不同的返回值 来做分发
			 *	这个可能是一个复杂的迭代
			 *	@val 	{object|func|string|array} 
			 *	@opts 	{object} 	请求提交的ajax数据
			 * 	@this	{Post} 		Post实例
			 */
			handle_from_value : function( val , opts ){
				if( typeof val == "object" ){
					window.setTimeout( function(){
						opts.success( tool.get_rtn_val( val ) );
					} , Math.ceil( Math.random() * 10 ) * 100 );
				} else if( typeof val == "string" ){
					opts.__post = this;
					if( !this.jurls[ val ] ){
						this.jurls[ val ] = new Jurl( val );
					};
					this.jurls[ val ].send( opts );
				} else if( typeof val == "function" ){
					tool.handle_from_value.call( this , val( opts.data ) , opts );
				} else {
					return E( "Error return value." );
				};
			},
			/*!
			 *	debug模式时  将直接采用本地请求
			 *	@opts 	{object}	请求提交的ajax数据
			 *	@url 	{string} 	当前指向的Post实例
			 */
			debug_ajax : function( opts , url ){
				var _val,
					_self = opts.__post ? opts.__post : this,
					_x;
				if( !( _val = _self.orgin_jurl[ opts.url ] ) ){
					return E( opts.url + " Post url not exsist." );
				} else if( _self.jurls[ url ] instanceof Jurl ){
					if( !( _val = _self.jurls[ url ].config.value ) ){
						opts.__post = _self;
						return _self.jurls[ url ].send( opts );
					};
				};
				tool.handle_from_value.call( _self , _val , opts );
			},
			/*!
			 *	发送ajax的参数预处理
			 *	this 将被指向到Post实例
			 */
			ajax : function( url , data , callback , opts ){
				if( typeof url == "object" ){
					opts 		= callback 	|| {};
					callback 	= data 		|| false;
					data 		= url;
					url 		= false;
				} else if( typeof url == "function" ){
					opts 		= data;
					callback 	= url;
					data 		= {};
					url 		= false;
				} else if( typeof url != "string" ){
					return this.send;
				};
				new Ajax( this , url , data , callback , opts );
			},
			/*!
			 *	设置Post实例的通配配置
			 *	并处理当其debug为true时 需求的url转向文件
			 *	@conf 	{object} 	个性化配置
			 *	@opts 	{object} 	在个性化配置中 配置了项后的请求地址
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
					timeout 	: 20000,
					jurls 		: {}
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