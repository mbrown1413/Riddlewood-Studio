<script setup lang="ts">
import {Puzzle} from "~lib/Puzzle"
import {ProblemSolveAction} from "~ui/actions"

const props = defineProps<{
    puzzle: Puzzle,
    problemId: string | null,
}>()

const emit = defineEmits<{
    action: [action: ProblemSolveAction]
}>()

function startSolve() {
    if(props.problemId === null) {
        return
    }
    emit("action", new ProblemSolveAction(props.problemId))
}

</script>

<template>
    <div>
        <h4>Solver</h4>

        <VBtn
                enabled="problemId !== null"
                @click="startSolve"
        >
            Find Solutions
        </VBtn>
    </div>
</template>