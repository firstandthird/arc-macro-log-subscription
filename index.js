
module.exports = function (arc, cloudformation, stage) {
  if (!arc.logs) {
    return cloudformation;
  }
  const params = {};
  arc.logs.forEach(e => {
    if (e.length === 2) {
      params[e[0]] = e[1];
    } else {
      params[e[0]] = e.slice(1, e.length);
    }
  });

  const subscriptionFunction = params.subscriptionFunction || false;
  const subscriptionFilter = params.subscriptionFilter ? params.subscriptionFilter.join(' ') : false;
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
      if (subscriptionFunction && key !== subscriptionFunction) {
        cloudformation.Resources[`${key}LogGroupLambdaInvokePermission`] = {
          Type: 'AWS::Lambda::Permission',
          Properties: {
            Principal: { 'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com' },
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': [subscriptionFunction, 'Arn'] },
            SourceAccount: { Ref: 'AWS::AccountId' },
            SourceArn: { 'Fn::GetAtt': [`${key}LogGroup`, 'Arn'] }
          }
        };
        if (!subscriptionFilter || !subscriptionFunction) {
          return;
        }
        cloudformation.Resources[`${key}SubscriptionFilter`] = {
          Type: 'AWS::Logs::SubscriptionFilter',
          DependsOn: `${key}LogGroupLambdaInvokePermission`,
          Properties: {
            LogGroupName: { Ref: `${key}LogGroup` },
            FilterPattern: subscriptionFilter,
            DestinationArn: { 'Fn::GetAtt': [subscriptionFunction, 'Arn'] }
          }
        };
      }
    }
  });
  return cloudformation;
};
