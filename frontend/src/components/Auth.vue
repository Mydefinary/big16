<template>
    <div>
        <Number
            label="AuthId"
            v-model="value.authId"
            :editMode="editMode"
        />
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
            label="PasswordHash"
            v-model="value.passwordHash"
            :editMode="editMode"
        />
        <String
            label="RefreshToken"
            v-model="value.refreshToken"
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
    name: 'Auth',
    mixins:[BaseEntity],
    components:{
    },
    
    data: () => ({
        path: "auths",
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
