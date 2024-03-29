import { DEFAULT_MOVE_OPTS } from "../constants";
import { finishTask } from "./utils";

export const sourceTask = (creep: Creep, target: Source) => {
  const r = creep.harvest(target);
  switch (r) {
    case ERR_NOT_IN_RANGE:
      creep.goto(target);
      break;
    case OK:
      // No free space; full
      if (creep.store.getFreeCapacity() === 0) {
        // Creep is full
        if (!creep.room.controller)
          throw new Error("Creep is full in a room without a controller");

        const spawns = creep.room.find(FIND_MY_SPAWNS, {
          filter: (s) => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        });
        if (spawns.length) {
          finishTask(creep, spawns[0].id);
        } else {
          finishTask(creep, creep.room.controller.id);
        }
      }
      break;
    default:
      creep.speak("Unhandled mining case", r);
      break;
  }
};
