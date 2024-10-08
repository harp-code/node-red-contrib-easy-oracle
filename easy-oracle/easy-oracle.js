module.exports = function(RED) {
    //#region requires
    const oracledb = require('oracledb')
    oracledb.fetchAsString = [ oracledb.CLOB ];

    //#endregion
    
    //#region Execution Node
    
    function EasyOracleExecutionNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.server = RED.nodes.getNode(config.server);

        node.on('input', async function(msg, send, done) {

            let connection;

            try {
                let sql = msg.topic;
                let binds, options, result;

		//returns which connection to use
		const connectionToUse = () => {
			 const dbConfig =  {
	                    user: node.server.user,
	                    password: node.server.password,
	                    connectString : `${node.server.host}:${node.server.port}/${node.server.database}`,
	                    externalAuth  : false
	                  };
			 const getPassedInConfig = () => {
				if(msg.connection) {
					return {
					  user: msg.connection.user ?? '',
					  password: msg.connection.password ?? '',
					  connectString: `${msg.connection.host ?? ''}:${msg.connection.port ?? ''}/${msg.connection.database ?? ''}`,
					  externalAuth: false
					};
	
				}
				 else return undefined;
			 }
		   return getPassedInConfig() ?? dbConfig
		}
                connection = await oracledb.getConnection(connectionToUse());

                binds = {};

                options = {
                outFormat: oracledb.OUT_FORMAT_OBJECT,   // query result format
                // extendedMetaData: true,               // get extra metadata
                // prefetchRows:     100,                // internal buffer allocation size for tuning
                // fetchArraySize:   100                 // internal buffer allocation size for tuning
                };

                result = await connection.execute(sql, binds, options);
                msg.payload = result;
            } catch (err) {
				if(done){
					done(err);
				}
				else {
					node.error(err)
				}
					
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (err) {
						if(done){
							done(err);
						}
						else {
							node.error(err)
						}
                    }
                }
            }
            node.send(msg);
        });
    }
    //#endregion
    
    //#region Config Node
    
    function EasyOracleConfigNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        this.database = n.database;
        this.user = n.user;
        this.password = n.password;
    }

    //#endregion
    
    RED.nodes.registerType("easy-oracle",EasyOracleExecutionNode);
    RED.nodes.registerType("easy-oracle-config",EasyOracleConfigNode);

}











