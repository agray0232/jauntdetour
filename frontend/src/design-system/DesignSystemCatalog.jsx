import React, { useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Slider,
  Tab,
  TabList,
  Text,
  Toast,
  Toaster,
  ToastTitle,
  makeStyles,
  shorthands,
  tokens,
  useId,
  useToastController,
} from "@fluentui/react-components";
import BrandMark from "./BrandMark";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "./tokens";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    padding: jauntSpacing[6],
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase,
  },
  content: {
    display: "grid",
    maxWidth: "72rem",
    margin: "0 auto",
    rowGap: jauntSpacing[6],
  },
  header: {
    display: "flex",
    alignItems: "center",
    columnGap: jauntSpacing[4],
  },
  title: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  section: {
    display: "grid",
    rowGap: jauntSpacing[4],
    padding: jauntSpacing[5],
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  sectionTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  swatches: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
    gap: jauntSpacing[3],
  },
  swatch: {
    display: "grid",
    minHeight: "5.5rem",
    alignContent: "end",
    padding: jauntSpacing[3],
    borderRadius: jauntRadius.control,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: jauntSpacing[3],
  },
  field: {
    width: "min(100%, 22rem)",
  },
  slider: {
    width: "min(100%, 22rem)",
  },
  editorial: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  functional: {
    maxWidth: "42rem",
    margin: 0,
    fontSize: jauntTypography.size.body,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  accentButton: {
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.brand.accentStrong,
    ":hover": {
      color: jauntColors.neutral.foregroundOnDark,
      backgroundColor: jauntColors.brand.accent,
    },
  },
  statusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: jauntSpacing[2],
  },
  compact: {
    "@media (max-width: 48.75rem)": {
      padding: jauntSpacing[4],
    },
  },
});

const swatches = [
  ["Pine", jauntColors.brand.primary, jauntColors.neutral.foregroundOnDark],
  ["Heritage orange", jauntColors.brand.accent, jauntColors.neutral.foreground],
  ["Sun", jauntColors.brand.highlight, jauntColors.neutral.foreground],
  ["Sky", jauntColors.support.sky, jauntColors.neutral.foreground],
  ["Ink", jauntColors.neutral.foreground, jauntColors.neutral.foregroundOnDark],
  ["Canvas", jauntColors.neutral.background, jauntColors.neutral.foreground],
];

export default function DesignSystemCatalog() {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState("build");
  const toasterId = useId("design-system-toaster");
  const { dispatchToast } = useToastController(toasterId);

  return (
    <main className={`${styles.root} ${styles.compact}`}>
      <div className={styles.content}>
        <header className={styles.header}>
          <BrandMark size={56} />
          <div>
            <Text as="div" size={200} weight="semibold">
              Production foundations
            </Text>
            <h1 className={styles.title}>JauntDetour</h1>
          </div>
        </header>

        <section className={styles.section} aria-labelledby="catalog-colors">
          <h2 className={styles.sectionTitle} id="catalog-colors">
            Color language
          </h2>
          <div className={styles.swatches}>
            {swatches.map(([name, backgroundColor, color]) => (
              <div
                className={styles.swatch}
                key={name}
                style={{ backgroundColor, color }}
              >
                <Text weight="semibold">{name}</Text>
                <Text size={200}>{backgroundColor}</Text>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="catalog-type">
          <h2 className={styles.sectionTitle} id="catalog-type">
            Typography
          </h2>
          <p className={styles.editorial}>The road is only the beginning.</p>
          <p className={styles.functional}>
            Build the drive, discover worthwhile stops, and keep the complete
            route understandable with or without the map.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="catalog-controls">
          <h2 className={styles.sectionTitle} id="catalog-controls">
            Controls and feedback
          </h2>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(event, data) => setSelectedTab(data.value)}
          >
            <Tab value="build">Build</Tab>
            <Tab value="discover">Discover</Tab>
          </TabList>
          <Field className={styles.field} label="Origin">
            <Input placeholder="Atlanta, GA" />
          </Field>
          <Field
            className={styles.slider}
            label="Where along the route"
            hint="50% of the way"
          >
            <Slider aria-label="Where along the route" defaultValue={50} />
          </Field>
          <div className={styles.controls}>
            <Button appearance="primary">Create route</Button>
            <Button appearance="secondary">Clear</Button>
            <Button className={styles.accentButton}>Plan your Jaunt</Button>
            <Dialog>
              <DialogTrigger disableButtonEnhancement>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Save your Jaunt</DialogTitle>
                  <DialogContent>
                    Sign in to keep this route and return to it later.
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Cancel</Button>
                    </DialogTrigger>
                    <Button appearance="primary">Sign in</Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
            <Button
              onClick={() =>
                dispatchToast(
                  <Toast>
                    <ToastTitle>Jaunt saved</ToastTitle>
                  </Toast>,
                  { intent: "success" }
                )
              }
            >
              Show toast
            </Button>
          </div>
          <div className={styles.statusRow} aria-label="Status examples">
            <Badge appearance="tint" color="warning">
              Unsaved
            </Badge>
            <Badge appearance="tint" color="success">
              Saved
            </Badge>
            <Badge appearance="tint" color="danger">
              Failed
            </Badge>
          </div>
          <Toaster toasterId={toasterId} />
        </section>
      </div>
    </main>
  );
}
