<script setup lang="ts">
import {ref, Ref} from "vue"

const el: Ref<HTMLSelectElement | null> = ref(null)

type Item = {
    id: string,
    label: string,
    color?: string,
}

withDefaults(
    defineProps<{
        items: Item[],
        selectedIds: string[],
        showButtons?: boolean,
    }>(), {
        showButtons: false,
    }
)


const emit = defineEmits<{
    "update:selectedIds": [ids: string[]],
    add: [],
    remove: [],
}>()

function onItemsSelect() {
    if(el.value === null) return
    const selectedValues = Array.from(el.value.selectedOptions).map(option => option.value)
    emit('update:selectedIds', selectedValues)
}
</script>

<template>
    <div class="list-container">
        <div class="buttons" v-if="showButtons">
            <button
                class="action-button del-button"
                @click="emit('remove')"
            >-</button>
            <button
                class="action-button add-button"
                @click="emit('add')"
            >+</button>
        </div>
        <select
            ref="el"
            multiple
            :value="selectedIds"
            @change="onItemsSelect"
        >
            <option
                v-for="item in items"
                :value="item.id"
                :class="{'empty-label': !item.label}"
                :style="'--data-color:' + (item.color || '#000000')"
            >
                {{ item.label }}
                <span
                    v-if="!item.label"
                >
                    (empty name)
                </span>
            </option>
        </select>
    </div>
</template>

<style scoped>
.list-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

select {
    width: 100%;
    height: 100%;
    border: 0;
}
select .empty-label {
    color: #606060;
}
select .empty-label span {
    font-size: 75%;
}

.action-button {
    width: 50%;
}
.add-button {
    background-color: green;
}
.del-button {
    background-color: red;
}

/* Colored block showing the item color. */
option::before {
    content: "";
    display: inline-block;
    vertical-align: middle;
    width: 1em;
    height: 1em;
    margin-right: 0.5em;
    border: var(--bs-border-width) solid var(--bs-border-color);
    border-radius: 5px;
    background-color: var(--data-color); /* Var set on <option> */
}
</style>