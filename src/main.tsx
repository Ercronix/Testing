import { createLibraryExtension } from '@hmiproject/helio-sdk';
import { compassElement } from './compass/compassElement';
import { angleConversionProperty } from './dynamicProperties/angleConversion';
import { cardinalDirectionProperty } from './dynamicProperties/cardinalDirection';

export default createLibraryExtension({
  name: 'OpenBridge Instruments',
  description: 'OpenBridge design system navigation instruments for HELIO',
  version: '1.0.0',
  author: 'mornhinweg',

  minimumRequiredHelioVersion: '25.4.0',

  actions: [],

  dynamicProperties: [angleConversionProperty, cardinalDirectionProperty],

  elements: [compassElement],
});
