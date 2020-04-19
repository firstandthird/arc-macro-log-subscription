
module.exports = function (arc, cloudformation, stage) {
  if (!arc.logSubscription) {
    return cloudformation;
  }
  const params = {};
  arc.logSubscription.forEach(e => {
    if (e.length === 2) {
      params[e[0]] = e[1];
    } else {
      params[e[0]] = e.slice(1, e.length);
    }
  });

  const fnName = params.function || false;
  const filter = params.filter ? params.filter.join(' ') : false;
  const retention = params.retention;

  cloudformation.Resources.Role.Properties.Policies[0].PolicyDocument.Statement[0].Action.push('logs:PutSubscriptionFilter');

  Object.entries(cloudformation.Resources).forEach(([key, value]) => {
    if (value.Type === 'AWS::Serverless::Function') {
      //Set Log Group
      cloudformation.Resources[`${key}LogGroup`] = {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
          LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: key }]] },
          RetentionInDays: retention
        }
      };
      //skip if subscription consumer
      if (fnName && key !== fnName) {
        cloudformation.Resources[`${key}LogGroupLambdaInvokePermission`] = {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            Principal: { 'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com' },
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': [fnName, 'Arn'] },
            SourceAccount: { Ref: 'AWS::AccountId' },
            SourceArn: { 'Fn::GetAtt': [`${key}LogGroup`, 'Arn'] }
          }
        };
        if (!filter || !fnName) {
          return;
        }
        cloudformation.Resources[`${key}SubscriptionFilter`] = {
          Type: 'AWS::Logs::SubscriptionFilter',
          DependsOn: `${key}LogGroupLambdaInvokePermission`,
          Properties: {
            LogGroupName: { Ref: `${key}LogGroup` },
            FilterPattern: filter,
            DestinationArn: { 'Fn::GetAtt': [fnName, 'Arn'] }
          }
        };
      }
    }
  });
  return cloudformation;
};
