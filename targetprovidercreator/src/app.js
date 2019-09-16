export class App {
  configureRouter(config, router) {
    config.title = 'IBM';
    config.map([
      { route: ['', 'import-profile'], name: 'import-profile',      moduleId: 'import-profile',      nav: true, title: 'Import Profile' }
      ,{ route: 'schema',         name: 'schema',        moduleId: 'schema',        nav: true, title: 'Target Profile Definition' }
      ,{ route: 'help',  name: 'help', moduleId: 'help', nav: true, title: 'Help' }
    ]);

    this.router = router;
  }
}
