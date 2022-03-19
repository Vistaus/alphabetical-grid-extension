//Local extension imports
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { ExtensionHelper } = Me.imports.lib;
const ShellVersion = ExtensionHelper.shellVersion;

//Main imports
const { Gtk, Gio } = imports.gi;
const Adw = ShellVersion >= 42 ? imports.gi.Adw : null;

//Use _() for translations
const _ = imports.gettext.domain(Me.metadata.uuid).gettext;

var PrefsWidget = class PrefsWidget {
  constructor() {
    this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.alphabetical-app-grid');

    this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(Me.metadata.uuid);

    this.createPreferences();
    this.createAbout();
  }

  createPreferences() {
    //Use different UI file for GNOME 40+ and 3.38
    if (ShellVersion >= 40) {
      this._builder.add_from_file(Me.path + '/ui/prefs-gtk4.ui');
    } else {
      this._builder.add_from_file(Me.path + '/ui/prefs.ui');
    }

    //Get the settings container widget
    this.widget = this._builder.get_object('main-prefs');

    this.settingElements = {
      'sort-folders-switch': {
        'settingKey': 'sort-folder-contents',
        'bindProperty': 'active'
      },
      'folder-order-dropdown': {
        'settingKey': 'folder-order-position',
        'bindProperty': 'active-id'
      },
      'logging-enabled-switch': {
        'settingKey': 'logging-enabled',
        'bindProperty': 'active'
      }
    }

    //Loop through settings toggles and dropdowns and bind together
    Object.keys(this.settingElements).forEach((element) => {
      this._settings.bind(
        this.settingElements[element].settingKey, //GSettings key to bind to
        this._builder.get_object(element), //GTK UI element to bind to
        this.settingElements[element].bindProperty, //The property to share
        Gio.SettingsBindFlags.DEFAULT
      );
    });
  }

  createAbout() {
    //Use different UI file for GNOME 40+ and 3.38
    if (ShellVersion >= 40) {
      this._builder.add_from_file(Me.path + '/ui/about-gtk4.ui');
    } else {
      this._builder.add_from_file(Me.path + '/ui/about.ui');
    }

    //Get the about page and fill in values
    this.aboutWidget = this._builder.get_object('about-page');
    this._builder.get_object('extension-version').set_label('v' + Me.metadata.version.toString());
    this._builder.get_object('extension-icon').set_from_file(Me.path + '/icon.svg');
  }
}

function init() {
  ExtensionUtils.initTranslations();
}

function fillPreferencesWindow(window) {
  //Create pages and widgets
  let settingsWindow = new PrefsWidget();
  let settingsPage = new Adw.PreferencesPage();
  let settingsGroup = new Adw.PreferencesGroup();
  let aboutPage = new Adw.PreferencesPage();
  let aboutGroup = new Adw.PreferencesGroup();

  //Build the settings page
  settingsPage.set_title(_('Settings'));
  settingsPage.set_icon_name('preferences-system-symbolic');
  settingsGroup.add(settingsWindow.widget);
  settingsPage.add(settingsGroup);

  //Build the about page
  aboutPage.set_title(_('About'));
  aboutPage.set_icon_name('help-about-symbolic');
  aboutGroup.add(settingsWindow.aboutWidget);
  aboutPage.add(aboutGroup);

  //Add the pages to the window
  window.add(settingsPage);
  window.add(aboutPage);
}

function buildPrefsWidget() {
  let settingsWindow = new PrefsWidget();
  let settingsWidget = new Gtk.ScrolledWindow();

  //Use a stack to store pages
  let settingsStack = new Gtk.Stack();
  settingsStack.add_titled(settingsWindow.widget, 'settings', _('Settings'))
  settingsStack.add_titled(settingsWindow.aboutWidget, 'about', _('About'));

  let switcher = new Gtk.StackSwitcher();
  switcher.set_stack(settingsStack);

  //Add the stack to the scrolled window
  if (ShellVersion >= 40) {
    settingsWidget.set_child(settingsStack);
  } else {
    settingsWidget.add(settingsStack);
  }

  //Enable all elements differently for GNOME 40+ and 3.38
  if (ShellVersion >= 40) {
    settingsWidget.show();
  } else {
    settingsWidget.show_all();
  }

  //Modify top bar to add a page menu and title, when the window is ready
  settingsWidget.connect('realize', () => {
    let window;
    if (ShellVersion >= 40) {
      window = settingsWidget.get_root();
    } else {
      window = settingsWidget.get_toplevel();
    }
    let headerBar = window.get_titlebar();

    //Add page switching menu to header
    headerBar.pack_start(switcher);
    switcher.show();

    //Modify header bar title
    headerBar.title = _('Alphabetical App Grid Preferences');
  });

  return settingsWidget;
}
