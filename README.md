# macro-log-subscription
arc macro for cloudwatch log subscriptions

"retention" is specified in days and will default to
14 days if not explicitly specified

### example arc
```
@app
macro-test

@http
get /
post /log

@macros
log-subscription

@logs
subscriptionFunction PostLog
subscriptionFilter ?error ?notice ?timeout ?"timed out"
retention 14
```
