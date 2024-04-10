# M5: Distributed Execution Engine
> Full name: `Yuanfeng Li`
> Email:  `yuanfeng_li@brown.edu`
> Username:  `yli586`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `3` new software components, totaling `400` added lines of code over the previous implementation. Key challenges included:
1. How to apply my own store service to the stencil code. My code worked fine locally, but it cannot pass the gradescope because of incorrect data-loading.
I cannot see how the data is loaded of the hidden test, so it is very hard for me to debug. I solved this by submitting a zip file with store (which is derived on ED), and
manually creating a group folder with no data of the coordinator node.

2. How to store the result of shuffle persistently? When I am implementing the persistence storage of the shuffled result, I found there is a surprising bug
of `fs.readFileSync`. The file system on MacOS is not sensitive to upper/lower case! Therefore, if the key is "It", it can still read "../../store/..it" file, and return the 
value in it. I solved this by always using the mem to store the shuffled result then...

3. How to understand the notify service? In fact, I do not know how to implement a notify method in mr-service even after I completed all the functions. I implemented the notify functionality by the usage of [gid].comm.send, since we will wait for successfully gathering all the callback from the nodes in group before return the results, which means exactly waiting for all the nodes to complete their work.


## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: Passing all the tests.

*Performance*: It runs 56ms on ncdc in average, and 72ms on dlib in average.

## Key Feature
> Which extra features did you implement and how?
1. In-memory. You can pass a memory(true/false) to config. If 'true' is passed, all the manipulations are done in memory.
2. Compaction. The config can recieve a compactor method, and use it when shuffling.
3. Persistence: You can specify a group name {your_name} to config.out. The result will be stored in the {s-sid}/{your_name} folder persistently. 

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: `72h`

