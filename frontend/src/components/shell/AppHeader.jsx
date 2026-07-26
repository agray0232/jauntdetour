import React from "react";
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  MoreHorizontalRegular,
  PersonRegular,
  SignOutRegular,
} from "@fluentui/react-icons";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import BrandMark from "../../design-system/BrandMark";
import {
  jauntColors,
  jauntSize,
  jauntSpacing,
  jauntTypography,
} from "../../design-system/tokens";
import { useAuthSession } from "../../auth/AuthSessionProvider";

const useStyles = makeStyles({
  root: {
    position: "relative",
    zIndex: 2000,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    minHeight: jauntSize.header,
    padding: `0 ${jauntSpacing[5]}`,
    columnGap: jauntSpacing[6],
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    columnGap: jauntSpacing[2],
    color: tokens.colorNeutralForeground1,
    textDecorationLine: "none",
  },
  wordmark: {
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
    fontWeight: jauntTypography.weight.bold,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  desktopNav: {
    display: "flex",
    alignItems: "stretch",
    alignSelf: "stretch",
    columnGap: jauntSpacing[5],
  },
  navLink: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    minHeight: "2.75rem",
    color: tokens.colorNeutralForeground2,
    fontWeight: jauntTypography.weight.medium,
    lineHeight: jauntTypography.lineHeight.standard,
    textDecorationLine: "none",
    ":hover": {
      color: tokens.colorNeutralForeground1,
    },
    "&[aria-current='page']": {
      color: tokens.colorNeutralForeground1,
      fontWeight: jauntTypography.weight.bold,
      ":after": {
        position: "absolute",
        right: 0,
        bottom: 0,
        left: 0,
        height: "0.1875rem",
        backgroundColor: jauntColors.brand.accent,
        content: '""',
      },
    },
  },
  account: {
    display: "flex",
    justifyContent: "flex-end",
  },
  compactNav: {
    display: "none",
  },
  compact: {
    "@media (max-width: 48.75rem)": {
      gridTemplateColumns: "1fr auto",
      minHeight: "auto",
      padding: `${jauntSpacing[2]} ${jauntSpacing[3]} 0`,
      columnGap: jauntSpacing[3],
      rowGap: jauntSpacing[2],
    },
  },
  compactBrand: {
    "@media (max-width: 30rem)": {
      fontSize: jauntTypography.size.bodyLarge,
    },
    "@media (max-width: 20rem)": {
      display: "none",
    },
  },
  accountLabel: {
    "@media (max-width: 20rem)": {
      display: "none",
    },
  },
  ultraCompact: {
    "@media (max-width: 20rem)": {
      paddingRight: jauntSpacing[2],
      paddingLeft: jauntSpacing[2],
      columnGap: jauntSpacing[2],
    },
  },
  hideDesktop: {
    "@media (max-width: 48.75rem)": {
      display: "none",
    },
  },
  showCompact: {
    "@media (max-width: 48.75rem)": {
      display: "grid",
      gridColumn: "1 / -1",
      gridTemplateColumns: "1fr 1fr auto",
      alignItems: "stretch",
      minHeight: "2.75rem",
      columnGap: jauntSpacing[2],
    },
  },
  compactLink: {
    justifyContent: "center",
  },
});

export default function AppHeader() {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { status, user, signIn, signOut } = useAuthSession();
  const displayName = user && (user.display_name || user.email);

  const accountControl =
    status === "checking" ? (
      <Spinner size="tiny" label="Checking account" />
    ) : status === "signedIn" ? (
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button
            appearance="subtle"
            aria-label="Account menu"
            icon={<PersonRegular />}
          >
            <span className={styles.accountLabel}>
              {displayName || "Account"}
            </span>
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={() => navigate("/account")}>
              Account info
            </MenuItem>
            <MenuItem onClick={() => navigate("/trips")}>My Jaunts</MenuItem>
            <MenuItem icon={<SignOutRegular />} onClick={signOut}>
              Sign out
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    ) : (
      <Button
        appearance="primary"
        aria-label="Sign in"
        icon={<PersonRegular />}
        onClick={() =>
          signIn(`${location.pathname}${location.search}${location.hash}`)
        }
      >
        <span className={styles.accountLabel}>Sign in</span>
      </Button>
    );

  return (
    <header
      className={`${styles.root} ${styles.compact} ${styles.ultraCompact}`}
    >
      <Link className={styles.brand} to="/" aria-label="JauntDetour home">
        <BrandMark decorative size={36} />
        <span className={`${styles.wordmark} ${styles.compactBrand}`}>
          JauntDetour
        </span>
      </Link>

      <nav
        aria-label="Primary navigation"
        className={`${styles.desktopNav} ${styles.hideDesktop}`}
      >
        <NavLink className={styles.navLink} to="/plan">
          Plan a Jaunt
        </NavLink>
        <NavLink className={styles.navLink} to="/trips">
          My Jaunts
        </NavLink>
        <NavLink className={styles.navLink} to="/about">
          About
        </NavLink>
      </nav>

      <div className={styles.account}>{accountControl}</div>

      <nav
        aria-label="Compact navigation"
        className={`${styles.compactNav} ${styles.showCompact}`}
      >
        <NavLink
          className={`${styles.navLink} ${styles.compactLink}`}
          to="/plan"
        >
          Plan
        </NavLink>
        <NavLink
          className={`${styles.navLink} ${styles.compactLink}`}
          to="/trips"
        >
          My Jaunts
        </NavLink>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              aria-label="More navigation"
              icon={<MoreHorizontalRegular />}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={() => navigate("/about")}>About</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </nav>
    </header>
  );
}
