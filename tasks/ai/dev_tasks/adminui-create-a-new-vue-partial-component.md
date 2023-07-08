### TITLE
AdminUI - Create a new vue partial component
### DESCRIPTION
Create a new VueJS partial component, all Vuetify components are available, and the component should look very professional, Partial components are components that will be injected into some specific places in the project
### REQUIREMENTS
name: USER_INPUT
content: string, // (REQUIRED) A detailed description of the content of the component
### OUTPUT_FORMAT
VueJS Component
### OUTPUT_LOCATION
@/adminUI/partials/{{requirements.name}}.vue
### EXAMPLE
<template>
  <div class="">
    <!-- Your HTML code here -->
  </div>
</template>
<script>
export default {
  data() {
    return {
      // Your data here
    }
  },
}
</script>
<style>
  /* All CSS classes should be prefixed with a custom class name to ensure that CSS doesn't affect other components */
</style>
### END_OF_TASK