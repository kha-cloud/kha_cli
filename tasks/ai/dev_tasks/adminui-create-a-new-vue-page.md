### TITLE
AdminUI - Create a new vue page
### DESCRIPTION
Create a new vue page which is a VueJS component, all Vuetify components are available, and page should look very professional
### REQUIREMENTS
name: string, // (REQUIRED) The name for the page (KebabCase)
content: string, // (REQUIRED) A detailed description of the content of the page
### OUTPUT_FORMAT
VueJS Component
### OUTPUT_LOCATION
@/adminUI/pages/{{requirements.name}}.vue
### EXAMPLE
<template>
  <div class="custom-page-class-name-here">
    <!-- Your HTML code here -->
  </div>
</template>
<script>
export default {
  data() {
    // URL params are available in `this.params`
    return {
      // Your data here
    }
  },
}
</script>
<style>
  /* Your CSS here */
/* .custom-page-class-name-here .other_classes -> To ensure that CSS is only applied to this page */
</style>
### END_OF_TASK