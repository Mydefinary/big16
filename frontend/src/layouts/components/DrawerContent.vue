<script setup>
import {
  VerticalNavLink,
  VerticalNavSectionTitle,
} from '@layouts'
</script>

<template>
    <ul>
        <VerticalNavSectionTitle :item="{ heading: 'Auth' }" />
        <VerticalNavLink
            :item="{
                title: '인증',
                to: '/auths',
            }"
        />
        <VerticalNavSectionTitle :item="{ heading: 'User' }" />
        <VerticalNavLink
            :item="{
                title: '사용자',
                to: '/users',
            }"
        />
    </ul>
</template>
