# Making modules

**What is a module?** A module rappresents basically all components of Node-Home, from the main pannel to the integrations with different device manufacturers.

This document will go over all the informations needed to build a module.

## Lifecycle of a module

To ensure propper interaction between modules, each module goes trough a predefined set of steps which you will have to reproduce in your own module, and they are:
1. All Modules gets loaded
2. The main process emits the `init` event to all modules, here they can initialize their own process, like registering pages, devices, ecc... They can also register the `ready` event listener to other modules, which allows wait for them to be loaded and ready, before any interaction happens, which might otherwise result in an error
3. Once ready each module calls the `ready()` function, which not only tells other modules they are done loading and they can start interacting, but also tells the main process they are ready, which then opens the server, once all are done
4. Everything is now ready and working, all the modules are running and the server is ready to controll the home

## File structure

Node-Home gives freedom to the developer on how to structure their module. Each is located in their own folder in `./modules`, all it requires is an `index.js` file in the root, the rest is up to you.

## Example

Now, this might have been a little confusing, but fear not, it's actually pretty easy! To help you start here is an example `index.js`

```js
const main = require('../index');
const EventEmitter = main.CreateEventEmitter(exports);

main.on('init', () => {
    main.modules.deviceManager.on('ready', (deviceManager) => {
        deviceManager.connect({
            name: 'Awesome Button',
            module: 'foo',
            type: ['input'],
        });
    });
    EventEmitter.emit('ready');
});

```
Done! See, that wasn't too hard, althought that is only the tip of the ice, we have registered a device, we have not connected any, neither we got all the events to handle it ready, but that's something that you will figure out if needed.
