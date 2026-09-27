function resolveGreetingName(configuredName, getMessage) {
  return configuredName || getMessage("greetingDefaultName");
}

module.exports = { resolveGreetingName };
