[![Buy me a coffee](https://img.shields.io/badge/Donate-PayPal-green.svg)](http://2ka.by/coffee?project=chrome-jironimo)

# chrome-jironimo
Atlassian JIRA&trade; Agile extension for Chrome

## Chrome Web Store
[jironimo at google play](https://chrome.google.com/webstore/detail/jironimo/bplmocfiilcboedgegkcndbngiicdihl)

## Default hotkeys
Windows: `Alt + J`
Mac: `Command + J`

### Contribution
* [Help with translations](https://www.transifex.com/projects/p/chrome-jironimo/)
* Help by coding: fork the repo; do your stuff; create a new Pull Request.
* Join our chat [at gitter](https://gitter.im/chrome-jironimo).

### Hot to use it?
[Please, check the documentation project](http://chrome-jironimo.readthedocs.org/) (`docs` branch)
*I have no time for it right now, PR?*

### Repository clone
```
git clone --recursive https://github.com/kkamkou/chrome-jironimo.git
cd chrome-jironimo
```

### Use the source code
- Navigate to `chrome://extensions`
- Expand the developer dropdown menu and click `Load Unpacked Extension`
- Navigate to local folder `/build`

### Build
```bash
npm install && version='6.0.0' npm run build
```

### Docker
```bash
[sudo] docker build -t jironimo .
[sudo] docker run -ti --rm -e version='6.0.0' -v "${PWD}:/opt/app" jironimo
```

### License
**Boost Software License 1.0 (BSL-1.0)**
