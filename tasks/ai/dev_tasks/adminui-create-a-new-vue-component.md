### TITLE
AdminUI - Create a new vue component
### DESCRIPTION
Create a new VueJS component, all Vuetify components are available, and the component should look very professional
### REQUIREMENTS
name: string, // (REQUIRED) The name for the component (PascalCase)
props: list of strings, // (OPTIONAL) The props for the component (prop value should exist if v-model is used)
content: string, // (REQUIRED) A detailed description of the content of the component
### OUTPUT_FORMAT
VueJS Component
### OUTPUT_LOCATION
@/adminUI/components/{{requirements.name}}.vue
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