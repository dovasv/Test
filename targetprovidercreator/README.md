To run the app, follow these steps.

1. Ensure that the following tools are installed:
- NodeJS, v6.0.0 or greater (http://nodejs.org/) This include npm which you need for the next step.
- Git (https://git-scm.com/downloads)  Just use the default installation settings
- jspm v0.16, installed globally  (http://jspm.io/)  If you need to install it, run the following command on a command prompt/shell: `npm install -g jspm@0.16.47`

2. Get a public github account at github.com if you do not have one already

3. Configure jspm to use your github credentials with the following command.
`jspm registry config github`   and follow the prompts.  This is to bypass the github rate-limit so it can downloads without problem.

4. on a command prompt/shell, go to the same directory as this readme, run the command: `npm install`
  >**Note:** Windows users, if you get the error "unknown command unzip" you can solve this problem by doing `npm install -g unzip` and then re-running `npm install`.
5. To run the app, open index.html with firefox or serve it in a webserver
