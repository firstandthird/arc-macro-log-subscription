# macro-log-subscription
arc macro for cloudwatch log subscriptions

### example arc
```
@app
macro-test

@http
get /
post /log

@macros
log-subscription

@logSubscription
function PostLog
filter ?error ?notice ?timeout ?"timed out"
retention 14
```
