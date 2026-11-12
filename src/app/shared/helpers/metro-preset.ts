import { definePreset } from '@primeuix/themes';
import Nora from '@primeuix/themes/nora';

export const MetroPreset = definePreset(Nora, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '0',
      sm: '0',
      md: '0',
      lg: '0',
      xl: '0'
    }
  },
  semantic: {
    primary: {
      50: '#e6f7f7',
      100: '#b3e6e7',
      200: '#80d6d7',
      300: '#4dc5c7',
      400: '#26b8ba',
      500: '#00aba9',
      600: '#008287',
      700: '#006b6f',
      800: '#005457',
      900: '#004050',
      950: '#002a35'
    }
  },
  components: {
    toggleswitch: {
      root: {
        width: '2.75rem',
        height: '1.25rem',
        borderRadius: '0',
        gap: '0.125rem',
        borderWidth: '1px',
        background: '#a6a6a6',
        hoverBackground: '#969696',
        checkedBackground: '#008287',
        checkedHoverBackground: '#00aba9'
      },
      handle: {
        borderRadius: '0',
        size: '0.875rem',
        background: '#ffffff',
        hoverBackground: '#f5f5f5',
        checkedBackground: '#ffffff',
        checkedHoverBackground: '#ffffff'
      }
    }
  }
});
