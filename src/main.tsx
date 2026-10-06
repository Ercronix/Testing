import { createLibraryExtension } from '@hmiproject/helio-sdk';
import '@oicl/openbridge-webcomponents/dist/openbridge.css';
import { azimuthThrusterElement } from './elements/AzimuthThrusterElement';
import { compassElement } from './elements/CompassElement';
import { radialGaugeElement } from './elements/RadialGaugeElement';
import { flatCompassElement } from './elements/FlatCompassElement';
import { angleConversionProperty } from './dynamicProperties/angleConversion';
import { cardinalDirectionProperty } from './dynamicProperties/cardinalDirection';
import { automationButtonReadoutStackElement } from './elements/BuildingBlocks/AutomationButtonReadoutStackElement';
import { instrumentRadialElement } from './elements/BuildingBlocks/InstrumentRadialElement';
import { readoutBlockElement } from './elements/BuildingBlocks/ReadoutBlockElement';
import { sequenceLoadingSpinnerElement } from './elements/BuildingBlocks/SequenceLoadingSpinnerElement';
import { textboxElement } from './elements/BuildingBlocks/TextboxElement';
import { watchElement } from './elements/BuildingBlocks/WatchElement';
import { watchFlatElement } from './elements/BuildingBlocks/WatchFlatElement';
import { barHorizontalElement } from './elements/BarsGraphs/BarHorizontalElement';
import { barVerticalElement } from './elements/BarsGraphs/BarVerticalElement';

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
    automationButtonReadoutStackElement,
    instrumentRadialElement,
    readoutBlockElement,
    sequenceLoadingSpinnerElement,
    textboxElement,
    watchElement,
    watchFlatElement,
    barHorizontalElement,
    barVerticalElement,
  ],
});
