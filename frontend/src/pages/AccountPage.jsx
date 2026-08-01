import React from "react";
import {
  Button,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowRightRegular,
  PersonRegular,
  SignOutRegular,
} from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { useAuthSession } from "../auth/AuthSessionProvider";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../design-system/tokens";

const useStyles = makeStyles({
  page: {
    minHeight: "100%",
    padding: `${jauntSpacing[7]} max(${jauntSpacing[5]}, calc((100vw - 64rem) / 2)) ${jauntSpacing[9]}`,
    backgroundColor: tokens.colorNeutralBackground2,
    "@media (max-width: 30rem)": {
      padding: `${jauntSpacing[6]} ${jauntSpacing[4]} ${jauntSpacing[8]}`,
    },
  },
  header: {
    display: "grid",
    maxWidth: "42rem",
    marginBottom: jauntSpacing[7],
    rowGap: jauntSpacing[2],
  },
  eyebrow: {
    margin: 0,
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.bodySmall,
    fontWeight: jauntTypography.weight.bold,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  introduction: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodyLarge,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  profile: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    alignItems: "center",
    padding: `${jauntSpacing[5]} 0`,
    columnGap: jauntSpacing[4],
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
  },
  avatar: {
    display: "grid",
    width: "3.5rem",
    height: "3.5rem",
    placeItems: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: jauntRadius.round,
  },
  avatarIcon: {
    width: "1.75rem",
    height: "1.75rem",
  },
  profileCopy: {
    display: "grid",
    minWidth: 0,
    rowGap: jauntSpacing[1],
  },
  profileName: {
    overflowWrap: "anywhere",
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
    fontWeight: jauntTypography.weight.semibold,
  },
  profileEmail: {
    overflowWrap: "anywhere",
    color: tokens.colorNeutralForeground2,
  },
  details: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(17rem, 0.7fr)",
    gap: jauntSpacing[8],
    paddingTop: jauntSpacing[7],
    "@media (max-width: 44rem)": {
      gridTemplateColumns: "1fr",
      gap: jauntSpacing[7],
    },
  },
  section: {
    display: "grid",
    alignContent: "start",
    rowGap: jauntSpacing[4],
  },
  sectionTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  identityList: {
    display: "grid",
    margin: 0,
  },
  identityRow: {
    display: "grid",
    gridTemplateColumns: "minmax(8rem, 0.38fr) minmax(0, 1fr)",
    padding: `${jauntSpacing[4]} 0`,
    columnGap: jauntSpacing[4],
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
    "@media (max-width: 24rem)": {
      gridTemplateColumns: "1fr",
      rowGap: jauntSpacing[1],
    },
  },
  term: {
    color: tokens.colorNeutralForeground2,
    fontWeight: jauntTypography.weight.semibold,
  },
  value: {
    margin: 0,
    overflowWrap: "anywhere",
  },
  managed: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  actions: {
    display: "grid",
    justifyItems: "start",
    rowGap: jauntSpacing[3],
  },
  jauntsLink: {
    display: "inline-flex",
    minHeight: "2.625rem",
    alignItems: "center",
    padding: `0 ${jauntSpacing[4]}`,
    columnGap: jauntSpacing[2],
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    fontWeight: jauntTypography.weight.semibold,
    textDecorationLine: "none",
    borderRadius: jauntRadius.control,
    ":hover": {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
});

export default function AccountPage() {
  const styles = useStyles();
  const { signOut, user } = useAuthSession();
  const displayName = user?.display_name || "Name not provided";
  const email = user?.email || "Email not provided";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Text className={styles.eyebrow}>Your account</Text>
        <h1 className={styles.title}>Account info</h1>
        <p className={styles.introduction}>
          Review the identity connected to your saved Jaunts.
        </p>
      </header>

      <section className={styles.profile} aria-label="Account identity summary">
        <span className={styles.avatar} aria-hidden="true">
          <PersonRegular className={styles.avatarIcon} />
        </span>
        <div className={styles.profileCopy}>
          <span className={styles.profileName}>{displayName}</span>
          <span className={styles.profileEmail}>{email}</span>
        </div>
      </section>

      <div className={styles.details}>
        <section className={styles.section} aria-labelledby="identity-title">
          <h2 className={styles.sectionTitle} id="identity-title">
            Identity details
          </h2>
          <dl className={styles.identityList}>
            <div className={styles.identityRow}>
              <dt className={styles.term}>Display name</dt>
              <dd className={styles.value}>{displayName}</dd>
            </div>
            <div className={styles.identityRow}>
              <dt className={styles.term}>Email</dt>
              <dd className={styles.value}>{email}</dd>
            </div>
          </dl>
          <p className={styles.managed}>
            Your display name and email are managed by your sign-in account.
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="account-actions-title"
        >
          <h2 className={styles.sectionTitle} id="account-actions-title">
            Account actions
          </h2>
          <div className={styles.actions}>
            <Link className={styles.jauntsLink} to="/trips">
              View My Jaunts <ArrowRightRegular />
            </Link>
            <Button
              appearance="secondary"
              icon={<SignOutRegular />}
              onClick={signOut}
            >
              Sign out
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
