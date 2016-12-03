// dependencies
var request = require('request')
var jsdom = require('jsdom')
var fs = require('fs')
var cron = require('node-cron')

var meetingsCount = 0

// get config
var config = fs.readFileSync('./config.json')
config = JSON.parse(config.toString())

// debug
function debug(msg) {
  if (config.debug)
    console.info(msg)
}

// init
debug('Init')

cron.schedule('*/5 * * * *', function() { // run script each 5minutes
  debug('Check...')
  var startTime = Date.now()

  // cookies
  var cookies = request.jar()

  // Sign in
  request.get('https://candidature.42.fr/users/sign_in', {jar: cookies}, function (err, response, body) {
    if (err) return console.error(err)

    debug('1) First get request after ' + (Date.now() - startTime) + 'ms')

    jsdom.env(body, ["http://code.jquery.com/jquery.js"], function (err, window) {
      // get csrf protection token
      var authenticity_token = window.$('input[name="authenticity_token"]').val()
      // set credentials
      var data = {
        'utf8': '✓',
        'authenticity_token': authenticity_token,
        'user[email]': config.credentials.email,
        'user[password]': config.credentials.password,
        'commit': 'Se connecter'
      }

      debug('2) CSRF Token set after ' + (Date.now() - startTime) + 'ms')

      // send login request
      request.post({url: 'https://candidature.42.fr/users/sign_in', form: data, jar: cookies}, function (err, response, body) {
        if (err) return console.error(err)
        if (body != '<html><body>You are being <a href="https://candidature.42.fr/meetings">redirected</a>.</body></html>')
          return console.error(new Error('Invalid credentials'))

        debug('3) Logged after ' + (Date.now() - startTime) + 'ms')

        // Check meetings page
        request.get('https://candidature.42.fr/meetings', {jar: cookies}, function (err, response, body) {
          if (err) return console.error(err)

          debug('4) Get meetings after ' + (Date.now() - startTime) + 'ms')

          // parse
          jsdom.env(body, ["http://code.jquery.com/jquery.js"], function (err, window) {
            if (err) return console.error(err)

            // vars
            var results = {}
            var available = false

            // new meetings
            var requestMeetingsCount = window.$('table#index_meetings tbody').find('tr').length
            if (meetingsCount !== 0 && meetingsCount !== requestMeetingsCount) // table columns are more
              available = true // new meetings
            meetingsCount = requestMeetingsCount // update meetings count
            results.meetingsCount = meetingsCount

            // for each configured dates, check if it's available
            for (var i = 0; i < config.dates.length; i++) {
              var td = window.$('td:contains("' + config.dates[i] + '")') // get table's element with this date
              var tr = td.parent() // get table's line with this date
              var availabilityElement = window.$(tr.find('td')[1])
              var availability = availabilityElement.html().trim()

              if (availability == 'Plus de place') { // not available
                results[config.dates[i]] = false
              } else {
                results[config.dates[i]] = availability
                available = true
              }
            }

            // send SMS with Free API if enabled
            if (config.notifications.SMS && config.notifications.SMS.enabled && available) {
              // message
              var message = 'De nouvelles places sont disponibles pour le check-in !'

              if (config.notifications.SMS.service.freeAPI.user && config.notifications.SMS.service.freeAPI.pass) { // send with Free Mobile API
                // request
                var endpoint = 'https://smsapi.free-mobile.fr/sendmsg'
                endpoint += '?user=' + config.notifications.SMS.service.freeAPI.user
                endpoint += '&pass=' + config.notifications.SMS.service.freeAPI.pass
                endpoint += '&msg=' + message
                request.get(endpoint)
              }
            }

            return debug('Done.', results)
          })
        })
      })
    }
  );
  })

})
