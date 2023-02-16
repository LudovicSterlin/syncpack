import chalk from 'chalk';
import { ICON } from '../constants';
import type { InstanceGroup } from '../get-context/get-groups/version-group/instance-group';
import * as log from '../lib/log';
import type { Syncpack } from '../types';

export function list(ctx: Syncpack.Ctx): Syncpack.Ctx {
  ctx.versionGroups.reverse().forEach((versionGroup, i) => {
    // Annotate user-defined version groups
    if (!versionGroup.isDefault) log.versionGroupHeader(i);

    versionGroup.getAllInstanceGroups().forEach((instanceGroup) => {
      // Record that this project has mismatches, so that eg. the CLI can exit
      // with the correct status code.
      if (instanceGroup.isInvalid()) ctx.isInvalid = true;

      if (versionGroup.isBanned()) return logBanned(instanceGroup);
      if (versionGroup.isIgnored()) return logIgnored(instanceGroup);
      if (versionGroup.isUnpinned()) return logUnpinned(instanceGroup);
      if (instanceGroup.hasMismatchingVersions()) {
        return instanceGroup.hasUnsupportedVersion()
          ? logUnsupportedMismatches(instanceGroup)
          : logVersionMismatch(instanceGroup);
      }
      logVersionMatch(instanceGroup);
    });
  });

  return ctx;

  function logVersionMatch(instanceGroup: InstanceGroup): void {
    console.log(
      chalk`{dim -} {white ${
        instanceGroup.name
      }} {dim ${instanceGroup.getUniqueVersions()}}`,
    );
  }

  function logVersionMismatch(instanceGroup: InstanceGroup): void {
    console.log(
      chalk`{red ${ICON.cross} ${instanceGroup.name}} ${instanceGroup
        .getUniqueVersions()
        .map((version) =>
          version === instanceGroup.getExpectedVersion()
            ? chalk.green(version)
            : chalk.red(version),
        )
        .join(chalk.dim(', '))}`,
    );
  }

  function logIgnored(instanceGroup: InstanceGroup): void {
    console.log(
      chalk`{dim ${ICON.skip} ${instanceGroup.name}} is ignored in this version group`,
    );
  }

  function logBanned(instanceGroup: InstanceGroup): void {
    console.log(
      chalk`{red ${ICON.cross} ${instanceGroup.name}} {dim.red is banned in this version group}`,
    );
  }

  function logUnpinned(instanceGroup: InstanceGroup): void {
    const pinVersion = instanceGroup.versionGroup.getPinnedVersion();
    console.log(
      chalk`{red ${ICON.cross} ${instanceGroup.name}} {dim.red is pinned to ${pinVersion} in this version group}`,
    );
  }

  function logUnsupportedMismatches(instanceGroup: InstanceGroup): void {
    console.log(
      chalk`{red ${ICON.cross} ${
        instanceGroup.name
      }} {dim.red has mismatched versions which syncpack cannot fix: ${instanceGroup
        .getUniqueVersions()
        .map((version) => chalk.yellow(version))
        .join(chalk.dim(', '))}}`,
    );
  }
}
