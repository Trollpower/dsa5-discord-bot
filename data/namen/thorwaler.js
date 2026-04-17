const names = {
	'm': ['Agdan', 'Aki', 'Ansgar', 'Ansir', 'Arngrim', 'Arvid', 'Asgrimm', 'Askir', 'Asleif', 'Atli', 'Atmaskott', 'Beorn', 'Beowulf', 'Bjarni', 'Bjeri', 'Bjorn', 'Bjorne', 'Brand', 'Brynar', 'Dongrimm', 'Egil', 'Eindrin', 'Eirik', 'Eldgrimm', 'Faenwulf', 'Firunjar', 'Fjolnir', 'Fjonn', 'Frenjar', 'Frodi', 'Garald', 'Garulf', 'Geir', 'Gerskir', 'Gunn', 'Gunni', 'Hakon', 'Halfdan', 'Hallar', 'Hardger', 'Hardred', 'Hasgar', 'Helgi', 'Helgir', 'Herleif', 'Herm', 'Herolf', 'Hjerolf', 'Hjall', 'Hjalldi', 'Halmar', 'Hjalmar', 'Haldar', 'Hjaldar', 'Hjelm', 'Hjore', 'Ingald', 'Ingirid', 'Ingibjörg', 'Iskir', 'Islif', 'Isleif', 'Jora', 'Joran', 'Jurge', 'Kari', 'Karven', 'Ketil', 'Kjaskar', 'Laskar', 'Laske', 'Lif', 'Leif', 'Liskolf', 'Maednir', 'Noerre', 'Norri', 'Olav', 'Olgard', 'Olgi', 'Olvir', 'Orgen', 'Orm', 'Orozar', 'Ragnar', 'Raskir', 'Rekki', 'Rodi', 'Röngvald', 'Rorlif', 'Rorleif', 'Runolf', 'Sigridur', 'Sigrud', 'Solvi', 'Starkad', 'Steinar', 'Stirbjörn', 'Sven', 'Swafgard', 'Swaflif', 'Swafleif', 'Swafnan', 'Tevil', 'Thinmar', 'Thivar', 'Thorgrimm', 'Thorgun', 'Thorkar', 'Thorn', 'Thorwulf', 'Thurbold', 'Thure', 'Tjalf', 'Torben', 'Torbrand', 'Tore', 'Torfin', 'Torgal', 'Torkil', 'Torlif', 'Torstor', 'Trollwulf', 'Tronde', 'Vandrad', 'Walkir', 'Wulfgrimm', 'Yngvar'],
	'f': ['Akja', 'Alfhild', 'Aelfhild', 'Algrid', 'Alvida', 'Andra', 'Anga', 'Anhild', 'Arva', 'Asgerd', 'Asgerda', 'Asgrima', 'Askra', 'Beornhild', 'Bera', 'Bjarnilda', 'Blodgrima', 'Branda', 'Bridgera', 'Bryda', 'Eilif', 'Eindara', 'Eirnid', 'Eldgrima', 'Estrid', 'Eyvin', 'Firunja', 'Fjaellgard', 'Frenja', 'Freya', 'Freiya', 'Fridger', 'Fridgera', 'Garhelt', 'Garhilda', 'Grima', 'Gunbritt', 'Gunda', 'Gundrid', 'Hallbera', 'Hardsgera', 'Helma', 'Hilda', 'Hjalda', 'Hjaldis', 'Hjalfrida', 'Hjalka', 'Hjalla', 'Hjalma', 'Hjelgira', 'Hjora', 'Hjordis', 'Hrafnhild', 'Idun', 'Ifirniane', 'Ifirnslinda', 'Ilkja', 'Ingira', 'Isliv', 'Isliva', 'Jadra', 'Janda', 'Jandra', 'Jora', 'Jurga', 'Karva', 'Katla', 'Kjaska', 'Korja', 'Lialin', 'Liflind', 'Lingard', 'Livka', 'Marada', 'Nellgard', 'Norhild', 'Odda', 'Olburga', 'Olgerda', 'Olverja', 'Ragna', 'Rangnid', 'Ragnild', 'Raska', 'Rötlinee', 'Rötlinede', 'Rorlif', 'Rorlifa', 'Salda', 'Shaya', 'Sigrid', 'Sigrida', 'Sigrun', 'Solva', 'Solveig', 'Svala', 'Svenja', 'Svenna', 'Swafgard', 'Swafnild', 'Swangard', 'Swanja', 'Thora', 'Thordis', 'Thorfinna', 'Thorhalla', 'Thula', 'Tjalva', 'Torgrid', 'Torlind', 'Wulfgard', 'Wulfgarda', 'Wulfhild', 'Wulfhilda', 'Wulflind', 'Wulflinda', 'Yasma'],
};

const thorwaler = {
	'kind': 'Thorwaler',
	'lastNames': {
		'nobility': {
			'names': [],
		},
		'common': {
			'names': [],
			'postfix': {
				'm': 'son',
				'f': 'dottir',
			},
		},
	},
	'firstNames': [],
	'preposition': {
		'names': [],
	},
	'post': {
		'prefix': ['von der'],
		'names': ['Donnerkeil', 'Eiszwinger', 'Eldgrimm', 'Fjordzwinger', 'Geraldssons', 'Gischtreiter', 'Haitaucher', 'Hammerfaust', 'Hjörnen', 'Klippenzwinger', 'Lassirer', 'Drachen', 'Nordlicht', 'Orkschläger', 'Seewölfe', 'Sturmkinder', 'Sturmmöven', 'Sturmspeere', 'Thorfinn', 'Walsinger', 'Wellenbrecher', 'Windlästerer', 'Windzwinger', 'Wogenreiter'],
		'postfix': ['Ottajasko'],
	},
};

export function data() {
	thorwaler.lastNames.common.names = names.f.map(x => x + thorwaler.lastNames.common.postfix.f).concat(names.m.map(x => x + thorwaler.lastNames.common.postfix.m));
	thorwaler.firstNames = names;
	return thorwaler;
}