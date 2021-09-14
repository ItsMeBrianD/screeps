import type {Role, RoleDeclaration} from "../../creep_behaviors/roles";
import {roles} from "../../creep_behaviors/roles";

function canSpawnBody(preferredSpawner: StructureSpawn, b: BodyPartConstant[]): unknown {
    return preferredSpawner.spawnCreep(b, "", {dryRun: true}) === OK;
}

export const census = (room: Room) => {
    console.log(`Executing Census for room ${room.name}`);

    const preferredSpawner = room.find(FIND_MY_SPAWNS).reduce<StructureSpawn | undefined>(
        (p, c) => (p?.store && p.store.getUsedCapacity(RESOURCE_ENERGY) > c.store.getUsedCapacity(RESOURCE_ENERGY)
            ? p
            : c)
        , undefined,
    );
    // No spawner, no point;
    if (!preferredSpawner) return;
    
    
    const creeps = room.find(FIND_MY_CREEPS);
    const currentPopulation: Record<Role, number>
    = creeps.reduce<Record<Role, number>>((out, creep) => {
        out[creep.memory.role] += 1;
        return out;
    }, {"harvester": 0, "builder": 0});
    
    // Use find instead of forEach to let us bail out when we need to
    Object.entries(currentPopulation).find(([roleName, population]: [Role, number]) => {
        // Get the role
        const role: RoleDeclaration = roles[roleName];
        // Check current population
        if (population >= role.targetPopulation) {
            // Population is correct, keep goin'
            return false;
        }
        // Pre-set memory
        const memory = {
            role: roleName,
        };
        // Identify target body
        let targetBody: BodyPartConstant[];
        if (role.bodies.length === 1 || population === 0) {
            /*
             * If there is only 1 type, or there are no screeps
             * Use the last (cheapest) body
             */
            targetBody = role.bodies[role.bodies.length - 1];
        } else {
            // Get current population ratio
            const ratio = population / role.targetPopulation;
            /**
             * Find which bodies are allowed for this population
             * Such that [a,b,c]
             * ratio > 1.2 ^ 1 (0.83) -> a is allowed
             * ratio > 1.2 ^ 2 (0.69) -> b is allowed
             * ratio > 1.2 ^ 3 (0.57) -> c is allowed
             * .
             * In theory, if a population is 85% full; only the first body will be allowed
             * If a population is ~70% full, the first and second (which is cheaper) will be allowed
             */
            const availableBodies = role.bodies.reverse().filter((a, i) => ratio > 1 / Math.pow(1.2, i));
            const spawnable = availableBodies.find(b => canSpawnBody(preferredSpawner, b));
            if (!spawnable) return false;
            targetBody = spawnable!;
        }
        preferredSpawner.spawnCreep(targetBody, `${roleName}${Game.time}`, {memory});
        return true;
    });
};
