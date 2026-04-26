const ICONS = {
  // vehicles
  airplane: '✈️', ambulance: '🚑', bicycle: '🚲', boat: '⛵', bus: '🚌',
  car: '🚗', excavator: '🚜', fire_truck: '🚒', garbage_truck: '🚛',
  helicopter: '🚁', hot_air_balloon: '🎈', motorcycle: '🏍️',
  police_car: '🚓', race_car: '🏎️', school_bus: '🚌', submarine: '🚢',
  subway: '🚇', tractor: '🚜', train: '🚆', truck: '🚚',
  // animals
  bear: '🐻', cat: '🐱',
  chicken: '🐔', cow: '🐄', dog: '🐕', duck: '🦆', elephant: '🐘', frog: '🐸', horse: '🐴',
  lion: '🦁', monkey: '🐒', pig: '🐖', sheep: '🐑',
  tiger: '🐯', whale: '🐋',
  // household
  alarm_clock: '⏰', doorbell: '🔔', hair_dryer: '💨', kettle: '🫖',
  knock: '🚪', microwave: '🔌', phone: '📞', typing: '⌨️',
  vacuum: '🧹', washing_machine: '🧺',
  // instruments
  drum: '🥁', guitar: '🎸',
  harmonica: '🎶', piano: '🎹',
  shaker: '🎵', tambourine: '🪘',
  triangle: '🔔', trumpet: '🎺', violin: '🎻', xylophone: '🎹',
  // nature
  birds: '🐦', campfire: '🔥',
  insects: '🦗', ocean: '🌊', rain: '🌧️',
  rainy_night: '🌃', stream: '💧', thunder: '⚡', wind: '🌬️',
  // ambience
  cafe: '☕', classroom: '🏫', kitchen: '🍳', library: '📚',
  market: '🛒', playground: '🛝', subway_car: '🚇',
};

export function iconFor(key: string | undefined | null): string {
  if (!key) return '🔊';
  return (ICONS as Record<string, string>)[key] ?? '🔊';
}
