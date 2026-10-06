import { createLibraryExtension } from '@hmiproject/helio-sdk';
import '@oicl/openbridge-webcomponents/dist/openbridge.css';
import { azimuthThrusterElement } from './elements/AzimuthThrusterElement';
import { compassElement } from './elements/CompassElement';
import { radialGaugeElement } from './elements/RadialGaugeElement';
import { flatCompassElement } from './elements/FlatCompassElement';
import { angleConversionProperty } from './dynamicProperties/angleConversion';
import { cardinalDirectionProperty } from './dynamicProperties/cardinalDirection';
import { barHorizontalElement } from './elements/BuildingBlocks/BarHorizontalElement';
import { barVerticalElement } from './elements/BuildingBlocks/BarVerticalElement';
import { circularProgressElement } from './elements/BuildingBlocks/CircularProgressElement';
import { instrumentRadialElement } from './elements/BuildingBlocks/InstrumentRadialElement';
import { readoutBlockElement } from './elements/BuildingBlocks/ReadoutBlockElement';

export default createLibraryExtension({
  name: 'OpenBridge Instruments',
  description: 'OpenBridge design system navigation instruments for HELIO',
  version: '1.0.0',
  author: 'mornhinweg',

  minimumRequiredHelioVersion: '25.4.0',

  actions: [],

  dynamicProperties: [angleConversionProperty, cardinalDirectionProperty],

  elements: [
    compassElement,
    azimuthThrusterElement,
    radialGaugeElement,
    flatCompassElement,
    barHorizontalElement,
    barVerticalElement,
    circularProgressElement,
    instrumentRadialElement,
    readoutBlockElement,
  ],
});
