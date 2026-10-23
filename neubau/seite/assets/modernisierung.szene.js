// erzeugt von neubau/bauen.py aus neubau/szenen/modernisierung.json – nicht von Hand ändern
export default {
 "szene": "modernisierung",
 "schema": 1,
 "bilder": 380,
 "bogen": [
  -11,
  11,
  -13,
  15
 ],
 "gegenstaende": {
  "alter_monitor": {
   "form": {
    "breite": 2.4,
    "tiefe": 1.8,
    "hoehe_vorn": 2.1,
    "hoehe_hinten": 1.15,
    "anzeige": {
     "breite": 1.7,
     "hoehe": 1.3,
     "oben": 0.22
    }
   },
   "lage": {
    "breit": {
     "x": -1.5,
     "y": 0
    },
    "hochkant": {
     "x": 0,
     "y": 0
    }
   },
   "versatz": [
    0,
    0,
    0
   ],
   "drehung_z": 0
  },
  "neuer_monitor": {
   "form": {
    "fuss": [
     1.3,
     0.6,
     0.03
    ],
    "hals": [
     0.34,
     0.78,
     0.03
    ],
    "schirm": [
     2.86,
     1.89,
     0.03
    ],
    "rand_oben": 0.07,
    "kinn": 0.12,
    "z_schirm": 0.55
   },
   "lage": {
    "breit": {
     "x": 1.6,
     "y_hals": 0.45
    },
    "hochkant": {
     "x": 0.3,
     "y_hals": 5.75
    }
   },
   "versatz": [
    0,
    0,
    0
   ],
   "drehung_z": 0
  },
  "titelkarte": {
   "form": {
    "breite": 3.8,
    "hoehe": 0.95,
    "dicke": 0.02,
    "neigung_grad": 18
   },
   "lage": {
    "breit": {
     "x": -1.5,
     "y": -4.4
    },
    "hochkant": {
     "x": -1.6,
     "y": -5.6
    }
   },
   "versatz": [
    0,
    0,
    0
   ],
   "drehung_z": 0
  }
 },
 "druckflaechen": {
  "titel": {
   "traeger": "Titel",
   "seite": "vorn",
   "grund": "flaeche",
   "aufloesung": 360,
   "einblenden": null,
   "elemente": [
    {
     "typ": "text",
     "text": "Modernisierung",
     "x": 0,
     "y": 0.14,
     "breite": 3.8,
     "groesse": 0.46,
     "zeilenhoehe": 1.2,
     "schrift": "serif-titel",
     "farbe": "tinte",
     "ausrichtung": "mitte"
    },
    {
     "typ": "linie",
     "von": [
      0.3,
      0.86
     ],
     "bis": [
      3.5,
      0.86
     ],
     "farbe": "#c4cbd6",
     "breite": 0.008
    }
   ],
   "pruefen": {
    "bilder": [
     0
    ]
   }
  },
  "lesestelle": {
   "traeger": "CRT_Front",
   "seite": "hinten",
   "grund": "flaeche",
   "aufloesung": 400,
   "einblenden": [
    306,
    322
   ],
   "elemente": [
    {
     "typ": "absaetze",
     "absaetze": [
      "Viele WordPress-Seiten laufen seit Jahren auf veralteten Themes, Plugins und PHP-Versionen.",
      "Ich bringe sie technisch und gestalterisch auf den heutigen Stand und achte darauf, dass Inhalte und Adressen erhalten bleiben."
     ],
     "rand": 0.2,
     "breite": 2.055,
     "groesse": 0.145,
     "zeilenhoehe": 1.32,
     "abstand": 0.9,
     "schrift": "grotesk",
     "farbe": "tinte",
     "senkrecht": "mitte"
    }
   ],
   "rahmen": [
    0.2,
    0.12345,
    2.25192,
    1.97655
   ],
   "pruefen": {
    "bilder": [
     324,
     352,
     380
    ]
   }
  }
 },
 "zeiten": {
  "schnitt": [
   12,
   40
  ],
  "raster": [
   24,
   48
  ],
  "geruest": [
   36,
   66
  ],
  "raster_aus": 124,
  "bauform": 140,
  "aufbau_bilder": [
   64,
   130,
   3
  ],
  "aufklappen": {
   "front": [
    68,
    92
   ],
   "seiten": [
    76,
    100
   ],
   "rueck": [
    84,
    108
   ],
   "deckel": [
    92,
    118
   ],
   "flach": [
    96,
    126
   ]
  },
  "umlegen": {
   "rueck": [
    262,
    288
   ],
   "deckel": [
    268,
    294
   ],
   "seiten": [
    276,
    298
   ],
   "front": [
    286,
    312
   ]
  },
  "alte_seite": [
   120,
   134
  ],
  "lesen": [
   324,
   380
  ]
 },
 "bloecke": {
  "skalierung": 1.35,
  "dicke": 0.012,
  "alte_lage": {
   "kopf": [
    0.06,
    0.06,
    1.58,
    0.22
   ],
   "bild": [
    0.06,
    0.33,
    0.765,
    0.55
   ],
   "text": [
    0.875,
    0.33,
    0.765,
    0.55
   ],
   "karten": [
    0.06,
    0.93,
    1.58,
    0.31
   ]
  },
  "zeiten": {
   "kopf": [
    150,
    182
   ],
   "bild": [
    172,
    204
   ],
   "text": [
    194,
    226
   ],
   "karten": [
    216,
    248
   ]
  },
  "schweben": {
   "kopf": 0.75,
   "bild": 0.9,
   "text": 0.8,
   "karten": 0.7
  },
  "anheben": {
   "kopf": 0.55,
   "bild": 0.8,
   "text": 0.65,
   "karten": 0.45
  },
  "anheben_hochkant": {
   "karten": 1.1
  }
 },
 "faden": {
  "breite": 0.06,
  "tor_schritt": {
   "breit": 1.6,
   "hochkant": 2.2
  },
  "kontrolle": {
   "breit": [
    [
     1.0,
     -5.5
    ],
    [
     3.9,
     -3.2
    ],
    [
     4.6,
     0.2
    ]
   ],
   "hochkant": [
    [
     2.5,
     -5.0
    ]
   ]
  },
  "punkt": {
   "rampe": 30,
   "bremse": 0.5,
   "lesen": [
    [
     324,
     380
    ]
   ]
  }
 },
 "kamera": {
  "breit": {
   "vfov": 30,
   "aspekt": [
    16,
    9
   ],
   "proben_aufloesung": [
    1440,
    810
   ],
   "einstellungen": [
    {
     "name": "D1 Eingang und Bau",
     "von": 0,
     "bis": 100,
     "neigung": 26,
     "gier": 0,
     "rand": 0.05,
     "lage_v": 0.5,
     "rahmt": [
      {
       "was": "alles_flach"
      },
      {
       "was": "bauform"
      }
     ]
    },
    {
     "name": "D2 Handlung",
     "von": 140,
     "bis": 252,
     "neigung": 27,
     "gier": 0,
     "rand": 0.06,
     "lage_v": 0.5,
     "rahmt": [
      {
       "was": "geraete_und_bloecke",
       "bilder": [
        140,
        252,
        4
       ]
      }
     ]
    },
    {
     "name": "D3 Lesestelle",
     "von": 324,
     "bis": 380,
     "neigung": 56,
     "gier": 0,
     "rand": 0.06,
     "lage_v": 0.5,
     "x_fest": "front_mitte",
     "rahmt": [
      {
       "was": "front_schirm_fuss",
       "bild": 380
      },
      {
       "was": "lesetext"
      },
      {
       "was": "netz",
       "bild": 380
      }
     ]
    }
   ]
  },
  "hochkant": {
   "vfov": 50,
   "aspekt": [
    9,
    19.5
   ],
   "proben_aufloesung": [
    390,
    845
   ],
   "einstellungen": [
    {
     "name": "H1 Eingang und Bau",
     "von": 0,
     "bis": 100,
     "neigung": 42,
     "gier": 0,
     "rand": 0.05,
     "lage_v": 0.5,
     "rahmt": [
      {
       "was": "alles_flach"
      },
      {
       "was": "bauform"
      }
     ]
    },
    {
     "name": "H2 Handlung",
     "von": 140,
     "bis": 252,
     "neigung": 38,
     "gier": 0,
     "rand": 0.05,
     "lage_v": 0.5,
     "rahmt": [
      {
       "was": "geraete_und_bloecke",
       "bilder": [
        140,
        252,
        4
       ]
      }
     ]
    },
    {
     "name": "H3 Lesestelle",
     "von": 324,
     "bis": 380,
     "neigung": 58,
     "gier": 0,
     "rand": 0.1,
     "lage_v": 0.5,
     "x_fest": "front_mitte",
     "rahmt": [
      {
       "was": "lesetext"
      }
     ]
    }
   ]
  }
 },
 "eingang": {
  "breit": {
   "bild": 0,
   "faden": {
    "punkt": [
     0.86,
     -8.6
    ],
    "richtung_grad": 0
   }
  },
  "hochkant": {
   "bild": 0,
   "faden": {
    "punkt": [
     0.62,
     -10.4
    ],
    "richtung_grad": 0
   }
  }
 },
 "ausgang": {
  "breit": {
   "bild": 380,
   "faden": {
    "punkt": [
     4.6,
     3.4
    ],
    "richtung_grad": 0
   }
  },
  "hochkant": {
   "bild": 380,
   "faden": {
    "punkt": [
     2.5,
     5.8
    ],
    "richtung_grad": 0
   }
  }
 },
 "pruefung": {
  "min_em_px": 16
 }
};
