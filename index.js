
module.exports = function (arc, cloudformation, stage) {
  const config = arc.logSubscription || [];

  const fnName = config[0][1]; //TODO: make this better
  let filterArr = config[1];
  filterArr.shift();
  const filter = filterArr.join(' ');
  const retention = config[2][1];

  cloudformation.Resources.Role.Properties.Policies[0].PolicyDocument.Statement[0].Action.push('logs:PutSubscriptionFilter');;

  Object.entries(cloudformation.Resources).forEach(([key, value]) => {
    if (value.Type == 'AWS::Serverless::Function') {

      //Set Log Group
      cloudformation.Resources[`${key}LogGroup`] = {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
          LogGroupName: {"Fn::Join": ["", ["/aws/lambda/", {"Ref": key}]]},
          RetentionInDays: retention
        }
      }

      //skip if subscription consumer
      if (key !== fnName) {
        cloudformation.Resources[`${key}LogGroupLambdaInvokePermission`] = {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            Principal: { "Fn::Sub": "logs.${AWS::Region}.amazonaws.com" },
            Action: "lambda:InvokeFunction",
            FunctionName: { "Fn::GetAtt" : [ fnName, "Arn" ] },
            SourceAccount: { "Ref": "AWS::AccountId" },
            SourceArn: { "Fn::GetAtt" : [ `${key}LogGroup`, "Arn" ] }
          }
        }

        cloudformation.Resources[`${key}SubscriptionFilter`] = {
          Type: "AWS::Logs::SubscriptionFilter",
          DependsOn: `${key}LogGroupLambdaInvokePermission`,
          Properties: {
            LogGroupName: { "Ref" : `${key}LogGroup` },
            FilterPattern: filter,
            DestinationArn: { "Fn::GetAtt" : [ fnName, "Arn" ] }
          }
        }
      }

    }
  });
  //console.log(JSON.stringify(cloudformation, null, 2));
  //throw new Error('stop');

  return cloudformation;
}
