# Sample Web UI

![CodeQL](https://img.shields.io/github/actions/workflow/status/device-management-toolkit/sample-web-ui/codeql-analysis.yml?style=for-the-badge&label=CodeQL&logo=github)
![Build](https://img.shields.io/github/actions/workflow/status/device-management-toolkit/sample-web-ui/nodejs.yaml?style=for-the-badge&logo=github)
![Codecov](https://img.shields.io/codecov/c/github/device-management-toolkit/sample-web-ui?style=for-the-badge&logo=codecov)
[![OSSF-Scorecard Score](https://img.shields.io/ossf-scorecard/github.com/device-management-toolkit/sample-web-ui?style=for-the-badge&label=OSSF%20Score)](https://api.securityscorecards.dev/projects/github.com/device-management-toolkit/sample-web-ui)
[![Discord](https://img.shields.io/discord/1063200098680582154?style=for-the-badge&label=Discord&logo=discord&logoColor=white&labelColor=%235865F2&link=https%3A%2F%2Fdiscord.gg%2FDKHeUNEWVH)](https://discord.gg/DKHeUNEWVH)
[![Docker Pulls](https://img.shields.io/docker/pulls/intel/oact-webui?style=for-the-badge&logo=docker)](https://hub.docker.com/r/intel/oact-webui)

> Disclaimer: Production viable releases are tagged and listed under 'Releases'. All other check-ins should be considered 'in-development' and should not be used in production

The Sample Web UI provides a reference UI solution to help demonstrate the core APIs and features of the Device Management Toolkit. Use it to help troubleshoot or try out new release features. This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.5.

<br><br>

**For detailed documentation** about Getting Started or other features of the Device Management Toolkit, see the [docs](https://device-management-toolkit.github.io/docs/).

<br>

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Backend CORS settings for the session cookie

The two builds carry the session differently. The cloud build (`npm start`) authenticates against MPS and RPS with an `Authorization: Bearer` header, because Kong verifies the JWT itself and reads it only from that header. It sends no credentials, so nothing below applies to it.

The Console/enterprise build authenticates with an HttpOnly session cookie, so every API request is sent with `withCredentials: true`. A browser discards a credentialed response whose `Access-Control-Allow-Origin` is the `*` wildcard, which means the backend has to name the UI origin explicitly and allow credentials. There is no dev proxy, so this applies to every local setup: the UI is served from `http://localhost:4200` while the backend listens on a different port.

For the Console/enterprise build (`npm run enterprise`, backend on `:8181`), set on the Console side:

```
HTTP_ALLOWED_ORIGINS=http://localhost:4200
HTTP_ALLOW_CREDENTIALS=true
```

Console defaults to `AllowedOrigins: ["*"]` with `AllowCredentials: false`, so both values are required — otherwise every API call fails CORS and the login request never stores its cookie.

Deployments that serve the UI from the same origin as the API need no CORS changes.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Vitest](https://vitest.dev). Tests run in Node against a simulated DOM ([happy-dom](https://github.com/capricorn86/happy-dom)) — no browser download is required.

## Using devcontainer

If you want debug in vscode devcontainer, try to open the project with devcontainer (Make sure you install the extension of **Dev Containers**)

- Step1: Press **Ctrl + Shift+ P** in vscode;
- Step2: Type **Dev Containers: Reopen in Container**;
- Step3: Click the item which appear in column;
- Step4: Open a terminal, run app with command `npm start`;

## Further Angular help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

<br>

## Additional Resources

- For detailed documentation and Getting Started, [visit the docs site](https://device-management-toolkit.github.io/docs).

- Looking to contribute? [Find more information here about contribution guidelines and practices](.\CONTRIBUTING.md).

- Find a bug? Or have ideas for new features? [Open a new Issue](https://github.com/device-management-toolkit/sample-web-ui/issues).

- Need additional support or want to get the latest news and events about Device Management Toolkit? Connect with the team directly through Discord.

  [![Discord Banner 1](https://discordapp.com/api/guilds/1063200098680582154/widget.png?style=banner2)](https://discord.gg/DKHeUNEWVH)
