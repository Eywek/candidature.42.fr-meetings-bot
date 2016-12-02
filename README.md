# candidature.42.fr-meetings-bot
A NodeJS bot for check if configured dates are available for meetings at 42 school

## Configuration

The `config.json` file need to be like this :

```json
{
  "credentials": {
    "email": "",
    "password": ""
  },
  "dates": [],
  "notifications": {
    "SMS": {
      "enabled": false,
      "service": {
        "freeAPI": {
          "user": "",
          "pass": ""
        }
      }
    }
  }
}
```

### Credentials

You need to set `credentials.email` and `credentials.password` with your 42's credentials (you need to sign up [here](https://candidature.42.fr/)).

### Dates

Dates need to be like this :
`04 fév. 2017 14:30`
__(Like it's displaying on https://candidature.42.fr/meetings page)__

### Notifications

You can receive notification if the application detect one of configured dates are available (or new) with Free Mobile API.
For that, you need to config your API credentials from Free Mobile.
