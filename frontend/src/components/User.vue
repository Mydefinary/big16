<template>
    <div>
        <Number
            label="UserId"
            v-model="value.userId"
            :editMode="editMode"
        />
        <String
            label="LoginId"
            v-model="value.loginId"
            :editMode="editMode"
        />
        <String
            label="Email"
            v-model="value.email"
            :editMode="editMode"
        />
        <String
            label="Nickname"
            v-model="value.nickname"
            :editMode="editMode"
        />
        <Date
            label="CreatedAt"
            v-model="value.createdAt"
            :editMode="editMode"
        />
        <String
            label="Role"
            v-model="value.role"
            :editMode="editMode"
        />
        <String
            label="Status"
            v-model="value.status"
            :editMode="editMode"
        />
        <String
            label="Company"
            v-model="value.company"
            :editMode="editMode"
        />
        <v-row class="ma-0 pa-0">
            <v-spacer></v-spacer>
            <v-btn width="64px" color="primary" @click="save">
                저장
            </v-btn>
        </v-row>
    </div>
</template>


<script>
import BaseEntity from './base-ui/BaseEntity.vue'

export default {
    name: 'User',
    mixins:[BaseEntity],
    components:{
    },
    
    data: () => ({
        path: "users",
        value: {
        }
    }),
    created(){
    },
    computed:{
    },
    methods: {
    },
}
</script>
