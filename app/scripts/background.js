// Automatic reloading for Chrome development
import 'chromereload/devonly';

// Polyfill the Web Extensions API for Chrome and Opera
import browser from 'webextension-polyfill';

import Zync from './zync';

const zync = new Zync();
