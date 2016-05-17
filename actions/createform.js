var AWS = require( "aws-sdk" );
var util = require( "util" );
var randomstring = require( "randomstring" );
var helpers = require( "../helpers" );
var Policy = require( "../s3post" ).Policy;
var S3Form = require( "../s3post" ).S3Form;
var AWS_CONFIG_FILE = "config.json";
var POLICY_FILE = "policy.json";
var INDEX_TEMPLATE = "index.ejs";
AWS.config.loadFromPath( './config.json' );
var simpleDB = new AWS.SimpleDB();
var domainName = 'Godziatkowski-domain';

createDomain();

var task = function( request, callback ){
    //1. load configuration
    var awsConfig = helpers.readJSONFile( AWS_CONFIG_FILE );
    var policyData = helpers.readJSONFile( POLICY_FILE );

    //2. prepare policy	
    policyData.conditions.push( { "x-amz-meta-ip-adress": request.ip } );
    policyData.conditions.push( { "x-amz-meta-name": "Jan" } );
    policyData.conditions.push( { "x-amz-meta-surname": "Godziatkowski" } );
    var policy = new Policy( policyData );

    //3. generate form fields for S3 POST
    var s3Form = new S3Form( policy );
    //4. get bucket name
    var bucket = policyData.conditions[1]["bucket"];
    var fields = s3Form.generateS3FormFields();
    s3Form.addS3CredientalsFields( fields, awsConfig );

    logToSimpleDB( request );


    callback( null, { template: INDEX_TEMPLATE,
        params: { fields: fields,
            bucket: bucket }
    } );
};

exports.action = task;


function createDomain(){
    var params = {
        DomainName: domainName
    };

    simpleDB.createDomain( params, function( err, data ){
        if( err ){
            console.log( err, err.stack );
        } else{
            console.log( data );
        }
    } );

}

function logToSimpleDB( request ){
    var params = {
        Attributes: [{
                Name: 'ip',
                Value: request.ip,
                Replace: false
            }, {
                Name: 'date',
                Value: ( new Date() ).toISOString(),
                Replace: false
            }
        ],
        DomainName: domainName,
        ItemName: randomstring.generate( 10 )
    };

    simpleDB.putAttributes( params, function( err, data ){
        if( err ){
            console.log( err, err.stack );
        } else{
            readAllFromSimpleDB();
        }
    } );
}

function readAllFromSimpleDB(){
    var query = 'Select * from `' + domainName + '`';

    var params = {
        SelectExpression: query
    };

    simpleDB.select( params, function( err, data ){
        if( err ){
            console.log( err );
        } else{
            console.log( data );
        }
    } );
}