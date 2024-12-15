import EventEmitter from './EventEmitter.js';

export default class BaseExtension extends EventEmitter {
    constructor() {
        super();
        this.canCreateDevice = false;
        this.isMounted = false;
    }

    mount() {
        this.isMounted = true;
    }

    unmount() {
        this.isMounted = false;
    }
}

// this implements the most basic device, with no real functionality
// but it does contain the schema and state validation
export class BaseDevice extends EventEmitter {
    constructor() {
        super();
		this.brand = 'Generic'; // this is just data for the UI
		this.model = 'Generic'; // this is just data for the UI

        this.isMounted = false;
    }

    mount() {
        this.isMounted = true;
    }

    /**
     * This can be empty when the device is not mounted, services should be ready to handle this
     */
    get state() {
        return {};
    }

    /**
     * Ideally, this is static
     * You are not supposed to change the schema after the device is created
     * and it should be available before as soon as the device is created
     */
    get schema() {
        return {};
    }

    isOnline() {
        return false;
    }

    updateState() {
        return false;
    }

    click() {
        return false;
    }

    /**
     * takes in a state and checks that the scheme matches it, and if needed converts the values
     * values not defined in the scheme are not kept
     * types that are not supported are not validated
     * current supported types are:
     * - switch (boolean)
     * - number (by default, it acts as a percentage, from 0 to 1)
     * - enum (a limited set of strings)
     * - string
     * - button (a button that can be clicked, no real value is associated with it)
     * see example for all available options
     * additionally, all types can be set to read-only by setting the readOnly property to true
     * eg.
    *  {
    *    light: {
    *      type: 'switch',
    *      color: "warmWhite", // optional, hint for the UI
    *      icon: "lightbulb", // optional, hint for the UI
    *    },
    *    brightness: {
    *      type: 'number',
    *      min: 0, // optional, default 0
    *      max: 1, // optional, default 1
    *      step: 0.01, // optional, default 0.01, set to 0 to disable
    *      enforceStep: true, // optional, if true, the value will be rounded to the nearest step
    *      enforceMinMax: true, // optional, if true, the value will be clamped to the min and max
    *      indents: [0, 0.5, 1], // optional, if provided, the UI will show these indents
    *      enforceIndents: true, // optional, if true, the value will be rounded to the nearest indent, step, min and max will be ignored
    *      color: "warmWhite", // optional, hint for the UI
    *      unit: "%", // optional, hint for the UI
    *    },
    *    mode: {
    *      type: 'enum',
    *      values: ['off', 'on', 'auto'], // required
    *      color: "warmWhite", // optional, hint for the UI
    *    },
    *    name: {
    *      type: 'string',
    *      readOnly: true, // optional, if true, the value can't be changed
    *      isPassword: true, // optional, if true, the value will be hidden in the UI
    *    },
    *    button: {
    *      type: 'button',
    *      color: "warmWhite", // optional, hint for the UI
    *    },
    *  }
     */
    validateStateUpdate(state = {}, force = false) {
        let result = {...this.state};
        for (let key in state) {
            if (!this.schema.hasOwnProperty(key)) continue;
            let value = state[key];
            if (value === undefined) continue;
            let schema = this.schema[key];
            if (schema.readOnly && !force) continue;
            switch (schema.type) {
                case 'switch':
                    if (typeof value === 'boolean') {
                        result[key] = value;
                    }
                    break;
                case 'number':
                    if (typeof value === 'number') {
                        if (schema.enforceIndents) {
                            let indent = schema.indents.find(indent => value <= indent);
                            value = indent || schema.min;
                        } else {
                            if (schema.enforceStep) {
                                value = Math.round(value / schema.step) * schema.step;
                            } else if (schema.enforceMinMax) {
                                if (schema.min !== undefined) {
                                    value = Math.max(schema.min, value);
                                }
                                if (schema.max !== undefined) {
                                    value = Math.min(schema.max, value);
                                }
                            }
                        }
                        result[key] = value;
                    }
                    break;
                case 'enum':
                    if (schema.values.includes(value)) {
                        result[key] = value;
                    }
                    break;
                case 'string':
                    if (typeof value === 'string') {
                        result[key] = value;
                    }
                    break;
                case 'button':
                    // buttons are ignored, you should call the click method instead
                    break;
                default:
                    result[key] = value;
                    break;
            }
        }
        return result;
    }

    toJSON() {
        return {
            id: this.deviceInfo.id,
            name: this.deviceInfo.name,
            schema: this.schema,
            state: this.state,
            isOnline: this.isOnline,
        };
    }
}