import {builder} from "./builder";
import {harvester} from "./harvester";

export const roles = {
    harvester: {
        name: "harvester" as const,
        targetPopulation: 6,
        behavior: harvester,
        bodies: [
            [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
            [WORK, CARRY, MOVE],
        ],
    },
    builder: {
        name: "builder" as const,
        targetPopulation: 3,
        behavior: builder,
        bodies: [
            [WORK, CARRY, MOVE],
        ],
    },
};


export type AvailableRoles = keyof typeof roles;
