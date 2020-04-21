# macro-log-subscription
arc macro for cloudwatch log subscriptions

"retention" is specified in days and will default to
14 days if not explicitly specified

## install

```
npm install arc-macro-logs
```

### example arc
```
@app
macro-test

@http
get /
post /log

@macros
arc-macro-logs

@logs
subscriptionFunction PostLog
subscriptionFilter ?error ?notice ?timeout ?"timed out"
retention 14
```
