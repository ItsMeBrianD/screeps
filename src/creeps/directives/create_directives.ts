import {Priority} from "../../constants";
import type {VirtualRoom} from "../../virtuals/VirtualRoom";
import type {AvailableDirective} from "./types";

const containerPriorityLookup: PartialRecord<StructureConstant, Priority> = {
    extension: Priority.HIGH,
};

const structurePriorityLookup: PartialRecord<StructureConstant, Priority> = {
    constructedWall: Priority.LOW,
    extension: Priority.HIGH,
};

export const createDirectives = (room: VirtualRoom) => {
    room.log(`Creating Directives`);
    const controller = room.room.controller;

    const containers = room.room.find(FIND_MY_STRUCTURES, {
        // @ts-expect-error Filter to only structures that have a store
        filter: s => s.store,
    }) as AnyStoreStructure[];
    containers.forEach(c => {
        if (c.store.getFreeCapacity(RESOURCE_ENERGY)) {
            const bestSource = room.findBestSource(c.pos);
            if (!bestSource) return;
            const storeDirective: AvailableDirective = {
                steps: [
                    {
                        type: "mine",
                        target: bestSource,
                    },
                    {
                        type: "deposit",
                        target: c.id,
                    },
                ],
                roles: ["laborer"],
                availableCount: 2,
                priority: containerPriorityLookup[c.structureType] ?? Priority.NORMAL,
            };
            room.addDirective(storeDirective);
    
        }
    });

    const spawns = room.room.find(FIND_MY_SPAWNS);
    spawns.forEach(s => {
        if (s.store.getFreeCapacity(RESOURCE_ENERGY)) {
            const bestSource = room.findBestSource(s.pos);
            if (!bestSource) return;
            const spawnDirective: AvailableDirective = {
                steps: [
                    {
                        type: "mine",
                        target: bestSource,
                    },
                    {
                        type: "deposit",
                        target: s.id,
                    },
                ],
                roles: ["laborer"],
                availableCount: 4,
                priority: Priority.HIGH,
            };
            room.addDirective(spawnDirective);
        }
    });

    const sites = room.room.find(FIND_MY_CONSTRUCTION_SITES);
    sites.forEach(s => {
        const bestSource = room.findBestSource(s.pos);
        if (!bestSource) return;
        const siteDirective: AvailableDirective = {
            steps: [
                {
                    type: "mine",
                    target: bestSource,
                },
                {
                    type: "build",
                    target: s.id,
                },
            ],
            availableCount: 2,
            roles: ["laborer"],
            priority: structurePriorityLookup[s.structureType] ?? Priority.NORMAL,
        };
        room.addDirective(siteDirective);
    });

    if (controller) {
        // Fall back to putting energy in the controller
        const bestSource = room.findBestSource(controller.pos);
        if (bestSource) {
            const controllerDirective: AvailableDirective = {
                steps: [
                    {
                        type: "mine",
                        target: bestSource,
                    },
                    {
                        type: "deposit",
                        target: controller.id,
                    },
                ],
                roles: ["laborer"],
                availableCount: 4,
                priority: controller.ticksToDowngrade > CONTROLLER_DOWNGRADE[controller.level] / 2 ? Priority.LOW : Priority.HIGH,
            };
            room.addDirective(controllerDirective);
        }

    }
};