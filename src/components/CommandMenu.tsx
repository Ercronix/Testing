import type { ObcCommandButton as ObcCommandButtonElement } from '@oicl/openbridge-webcomponents/dist/components/command-button/command-button.js';
import type { ObcCommandMenu as ObcCommandMenuElement } from '@oicl/openbridge-webcomponents/dist/components/command-menu/command-menu.js';
import { bindPopoverTrigger } from '@oicl/openbridge-webcomponents/dist/internal/popover-controller.js';
import { ObcCommandButton } from '@oicl/openbridge-webcomponents-react/components/command-button/command-button.js';
import { ObcCommandMenu } from '@oicl/openbridge-webcomponents-react/components/command-menu/command-menu.js';
import { ObiCommandAutoTrack } from '@oicl/openbridge-webcomponents-react/icons/icon-command-auto-track.js';
import { ObiCommandAutopilot } from '@oicl/openbridge-webcomponents-react/icons/icon-command-autopilot.js';
import { ObiCommandIn } from '@oicl/openbridge-webcomponents-react/icons/icon-command-in.js';
import { ObiCommandNo } from '@oicl/openbridge-webcomponents-react/icons/icon-command-no.js';
import { ObiJoystick } from '@oicl/openbridge-webcomponents-react/icons/icon-joystick.js';
import { ObiPropulsionAzimuthThruster } from '@oicl/openbridge-webcomponents-react/icons/icon-propulsion-azimuth-thruster.js';
import { ObiPropulsionMainEngine } from '@oicl/openbridge-webcomponents-react/icons/icon-propulsion-main-engine.js';
import { ObiPropulsionRudder } from '@oicl/openbridge-webcomponents-react/icons/icon-propulsion-rudder.js';
import { ObiPropulsionTunnelThruster } from '@oicl/openbridge-webcomponents-react/icons/icon-propulsion-tunnel-thruster.js';
import { className, cx } from '@hmiproject/helio-sdk';
import { useEffect, useLayoutEffect, useRef, type ComponentType, type CSSProperties } from 'react';

export const commandMenuIcons = [
  'auto',
  'joystick',
  'autopilot',
  'autoTrack',
  'mainEngine',
  'azimuthThruster',
  'tunnelThruster',
  'rudder',
  'none',
] as const;

export type CommandMenuIcon = (typeof commandMenuIcons)[number];

export const commandMenuModes = ['button', 'menu'] as const;

/**
 * `button`: an `<obc-command-button>` that opens the command menu as a popover.
 * `menu`: the command menu card itself, always visible.
 */
export type CommandMenuMode = (typeof commandMenuModes)[number];

export type CommandMenuProps = {
  /** Whether this station is in command. */
  inCommand: boolean;
  /** Status label, e.g. "Joystick". */
  status?: string;
  /** Description, e.g. "DP". */
  description?: string;
  /** Location, e.g. "Aft Bridge". Hidden when empty. */
  location?: string;
  /** Main icon; `auto` shows the "in command" / "no command" icon. */
  icon?: CommandMenuIcon;
  /** Switch label for taking command. */
  takeLabel?: string;
  /** Switch label for releasing command. */
  releaseLabel?: string;
  /** Switch state label while in command. */
  inCommandLabel?: string;
  /** Switch state label while not in command. */
  noCommandLabel?: string;
  mode?: CommandMenuMode;
  /** Disables all interaction (e.g. in the HELIO editor). */
  disabled?: boolean;
  /** Called when the user toggles the switch, with the requested state. */
  onChange?: (inCommand: boolean) => void;
};

/**
 * The switch flips itself on interaction. If `inCommand` has not followed the
 * request after this time (e.g. the write was rejected), it is reset to `inCommand`.
 */
const REVERT_DELAY_MS = 2000;

/** Gap between the command button and the menu, in px. */
const MENU_OFFSET = 4;
/** Minimum distance between the menu and the window edges, in px. */
const VIEWPORT_MARGIN = 8;

const iconComponents: Record<Exclude<CommandMenuIcon, 'auto' | 'none'>, ComponentType> = {
  joystick: ObiJoystick,
  autopilot: ObiCommandAutopilot,
  autoTrack: ObiCommandAutoTrack,
  mainEngine: ObiPropulsionMainEngine,
  azimuthThruster: ObiPropulsionAzimuthThruster,
  tunnelThruster: ObiPropulsionTunnelThruster,
  rudder: ObiPropulsionRudder,
};

const classNames = {
  root: className({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Noto Sans', sans-serif",
  }),
  disabled: className({ pointerEvents: 'none' }),
};

/**
 * Sets `inCommand` on the menu and on its internal start-stop switch. The
 * menu only forwards `inCommand` to the switch when it changes, so after the
 * switch flipped itself the menu's value alone is not enough to reset it.
 */
function syncInCommand(menu: ObcCommandMenuElement | null, inCommand: boolean) {
  if (!menu) return;
  menu.inCommand = inCommand;
  const toggle = menu.shadowRoot?.querySelector('obc-start-stop-switch') as {
    checked: boolean;
  } | null;
  if (toggle) toggle.checked = inCommand;
}

/**
 * Places the menu (a popover in the top layer, so `position: fixed`) below the
 * button, or above it when there is not enough space below, kept inside the window.
 */
function positionMenu(menu: HTMLElement, anchor: HTMLElement) {
  const anchorRect = anchor.getBoundingClientRect();
  const width = menu.offsetWidth || 360;
  const height = menu.offsetHeight;
  const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(anchorRect.left, maxLeft));
  const below = anchorRect.bottom + MENU_OFFSET;
  const above = anchorRect.top - MENU_OFFSET - height;
  const top = height > 0 && below + height > window.innerHeight && above >= 0 ? above : below;
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

/**
 * Presentational wrapper around OpenBridge's `<obc-command-menu>` and
 * `<obc-command-button>`. Receives fully resolved values; all HELIO dynamic
 * property handling happens in the element. Keeps its natural size, centered.
 */
export function CommandMenu({
  inCommand,
  status,
  description,
  location,
  icon = 'auto',
  takeLabel = 'Take',
  releaseLabel = 'Release',
  inCommandLabel = 'In CMD',
  noCommandLabel = 'No CMD',
  mode = 'button',
  disabled = false,
  onChange,
}: CommandMenuProps) {
  const buttonRef = useRef<ObcCommandButtonElement>(null);
  const menuRef = useRef<ObcCommandMenuElement>(null);
  const inCommandRef = useRef(inCommand);
  const revertTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useLayoutEffect(() => {
    inCommandRef.current = inCommand;
    clearTimeout(revertTimer.current);
    syncInCommand(menuRef.current, inCommand);
  }, [inCommand]);

  useEffect(() => () => clearTimeout(revertTimer.current), []);

  useEffect(() => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (mode !== 'button' || disabled || !button || !menu) return;

    const onBeforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open') positionMenu(menu, button);
    };
    // The size is only known once the menu is showing; correct the guess.
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open') positionMenu(menu, button);
    };
    const close = () => menu.hidePopover?.();
    menu.addEventListener('beforetoggle', onBeforeToggle);
    menu.addEventListener('toggle', onToggle);
    window.addEventListener('resize', close);
    const unbind = bindPopoverTrigger(button, menu);
    return () => {
      unbind();
      menu.removeEventListener('beforetoggle', onBeforeToggle);
      menu.removeEventListener('toggle', onToggle);
      window.removeEventListener('resize', close);
      if (menu.open) menu.open = false;
    };
  }, [mode, disabled]);

  const handleChange = (event: CustomEvent<{ inCommand: boolean }>) => {
    if (disabled) {
      syncInCommand(menuRef.current, inCommandRef.current);
      return;
    }
    onChange?.(event.detail.inCommand);
    clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(
      () => syncInCommand(menuRef.current, inCommandRef.current),
      REVERT_DELAY_MS,
    );
  };

  const IconComponent =
    icon === 'none'
      ? undefined
      : icon === 'auto'
        ? inCommand
          ? ObiCommandIn
          : ObiCommandNo
        : iconComponents[icon];
  const showLocation = location !== undefined && location !== '';

  const menu = (
    <ObcCommandMenu
      ref={menuRef}
      inCommand={inCommand}
      showLocation={showLocation}
      softDismiss={mode === 'button'}
      // No OpenBridge top bar in HELIO: the dismiss cover should span the whole window.
      style={{ '--topbar-height': '0px' } as CSSProperties}
      onChange={handleChange}
    >
      {IconComponent && (
        <div slot="command-icon">
          <IconComponent />
        </div>
      )}
      <div slot="command-status">{status}</div>
      <div slot="command-description">{description}</div>
      {showLocation && <div slot="command-location">{location}</div>}
      <div slot="toogle-action-to-in-command-label">{takeLabel}</div>
      <div slot="toogle-action-to-no-command-label">{releaseLabel}</div>
      <div slot="toogle-state-in-command-label">{inCommandLabel}</div>
      <div slot="toogle-state-no-command-label">{noCommandLabel}</div>
    </ObcCommandMenu>
  );

  return (
    <div
      className={cx(classNames.root, disabled && mode === 'menu' ? classNames.disabled : undefined)}
    >
      {mode === 'button' ? (
        <>
          <ObcCommandButton ref={buttonRef} inCommand={inCommand} />
          {menu}
        </>
      ) : (
        menu
      )}
    </div>
  );
}
