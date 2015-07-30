var Button = ReactBootstrap.Button
var Input = ReactBootstrap.Input
var Panel = ReactBootstrap.Panel
var Alert = ReactBootstrap.Alert
var Grid = ReactBootstrap.Grid
var Row = ReactBootstrap.Row
var Col = ReactBootstrap.Col
var Glyphicon = ReactBootstrap.Glyphicon
var TabbedArea = ReactBootstrap.TabbedArea
var TabPane = ReactBootstrap.TabPane

/**
 * バトルゲームのStore(モデル).
 * データストアとビジネスロジックを担当.
 */
var Store = {
	/**
	 * Storeの初期化を行う.
	 * @return void
	 */
	initialize() {
		let cookieFighters = reactCookie.load("fighters")
		if(cookieFighters) {
			this.fighters = cookieFighters.map((f) => {
				return this.injectFighterFunction(f)
			})
		} else {
			this.addNewFighter()
			this.addNewFighter()
		}
		this.clearDamage()
	},
	fighters: [],
	textQueue: [],
	/**
	 * 新しい闘士を追加する.
	 * @return Fighter 追加した闘士
	 */
	addNewFighter() {
		var f = this.injectFighterFunction(this.createFighter(this.nextId()))
		this.fighters.push(f)
		return f
	},
	/**
	 * @return Integer 次の闘士ID. 最大ID + 1.
	 */
	nextId() {
		if(this.fighters.length == 0) {
			return 0
		} else {
			return Math.max.apply(null, this.fighters.map((f) => {return f.id})) + 1
		}
	},
	/**
	 * 新しい闘士をテンプレートから作成する.
	 * @param  Integer id
	 * @return Fighter
	 */
	createFighter(id) {
		return {
			id: id,
			name: "Fighter " + (id + 1),
			attack: 25,
			defense: 25,
			speed: 25,
			maxHp: 25,
			damage: 0,
		}
	},
	/**
	 * Fighterに関数を注入する。
	 * cookieからロードしてきた時にfunctionがないので
	 */
	injectFighterFunction(fighter) {
		fighter.validate = function() {
			var result = []
			if(this.name == 0) result.push("名前を入力してください")
			result.push(this.validateParam(this.getAttack(), "攻撃力"))
			result.push(this.validateParam(this.getDefense(), "防御力"))
			result.push(this.validateParam(this.getSpeed(), "はやさ"))
			result.push(this.validateParam(this.getMaxHp(), "最大HP"))
			result = result.filter((r) => {return r})
			if(100 < this.getAttack() + this.getDefense() +
				this.getSpeed() + this.getMaxHp()) result.push("能力値の合計は100までです")
			return result.length == 0 ? null : result
		}
		fighter.validateParam = function(value, name) {
			if(parseInt(value) != value) return name + "は整数でなくてはいけません\n"
			if(value <= 0) return name + "は1より大きくなくてはいけません\n"
			return null
		}
		// 残HP修正点。残りHPが高いほど攻撃にプラス
		fighter.getModifyPoint = function() {
			return (this.maxHp - this.damage) * 0.2
		}
		fighter.getAttack = function() {
			return parseInt(this.attack)
		}
		fighter.getDefense = function() {
			return parseInt(this.defense)
		}
		fighter.getSpeed = function() {
			return parseInt(this.speed)
		}
		fighter.getMaxHp = function() {
			return parseInt(this.maxHp)
		}
		return fighter
	},
	getFighters() {
		return this.fighters // TODO 必要な項目に絞る
	},
	battle() {
		this.clearDamage()
		while(true) {
			var attacker = this.getAttacker()
			this.write(attacker.name + "の攻撃！")
			var enemy = this.getEnemy(attacker.id)
			var attack = (1 + Math.random()) * (attacker.getAttack() + attacker.getModifyPoint())
			var defense = (1 + Math.random()) * enemy.getDefense()
			if(defense < attack || Math.random() < 0.05) {
				let damage = Math.floor((attack - defense) / 2)
				if(damage < 1) damage = 1
				this.write(enemy.name + "に" + damage + "ポイントのダメージ！")
				enemy.damage += damage // 参照なので更新されるみたい
				if(enemy.maxHp <= enemy.damage) {
					this.write(enemy.name + "は死んでしまった！")
					if(this.getSurvivor().length <= 1) break;
				}
			} else {
				this.write(enemy.name + "にダメージを与えられない！")
			}
		}
		if(this.getSurvivor().length == 0) {
			this.write("誰も生き残らなかった……") // たぶんない
		} else {
			this.write(this.getSurvivor()[0].name + "は生き残った！")
		}
	},
	// ダメージクリア
	clearDamage() {
		this.fighters.forEach((f) => {f.damage = 0})
	},
	// サバイバーのリストを取得する
	getSurvivor() {
		return this.fighters.filter((f) => {
			return f.damage < f.getMaxHp()
		})
	},
	// 攻撃対象の選択
	getEnemy(id) {
		var list = this.getSurvivor().filter((f) => { return f.id != id})
		return list[Math.floor(Math.random() * list.length)]
	},
	// 攻撃者選定
	getAttacker() {
		var attacker = null, speed = 0, list = this.getSurvivor()
		for(var i = 0;i < list.length;i++) {
			var tempSpeed = Math.random() * (list[i].getSpeed() + list[i].getModifyPoint())
			if(speed < tempSpeed) {
				attacker = list[i]
				speed = tempSpeed
			}
		}
		return attacker
	},
	write(text) {
		this.textQueue.push(text + "\n")
	},
	// 全キャラバリデートする
	validate() {
		var result = []
		this.fighters.forEach((f) => {
			var v = f.validate()
			if(v) result = result.concat(v)
		})
		return result.length == 0 ? null : result
	},
	/**
	 * 戦闘結果テキストを１つずつ取得する.
	 */
	pullText() {
		return this.textQueue.shift()
	},
	/**
	 * 闘士のパラメータ更新を行う.
	 * cookieにも保存される.
	 */
	setFighterParam(id, key, value) {
		this.getFighterById(id)[key] = value
		this.saveToCookie()
	},
	/** cookieに全闘士情報を保存 */
	saveToCookie() {
		if(!this.validate()) reactCookie.save("fighters", this.fighters)
	},
	/**
	 * IDから闘士を取得する.
	 */
	getFighterById(id) {
		return this.fighters.filter((f) => {
			return f.id == id
		})[0]
	},
	/**
	 * 闘士を削除する
	 */
	removeFighter(id) {
		this.fighters = this.fighters.filter((f) => {
			return f.id != id
		})
		this.saveToCookie()
	},
}

Store.initialize()

/* こっからViewコンポーネント */

var Game = React.createClass({
	getInitialState() {
		return {
			editingTab: parseInt(Store.getFighters()[0].id),
			battleText: '',
			inBattle: false,
			fighters: Store.getFighters()
		}
	},
	componentDidUpdate() {
		if(!this.state.inBattle) return
		setTimeout(() => {
			if(0 < Store.textQueue.length) {
				this.setState({battleText: this.state.battleText + Store.pullText()})
			} else {
				this.setState({inBattle: false})
			}
		}, 1000)
	},
	onChangeEditor(id, key, value) {
		// Store.fighters[id][key] = value // TODO setter
		Store.setFighterParam(id, key, value)
		this.setState({fighters: Store.getFighters()})
	},
	// バトル可能か？
	canBattle() {
		return !this.state.inBattle && !Store.validate()
	},
	onFighterSelected(key) {
		console.info(key)
		if(key == -1) {
			if(this.state.inBattle) return
			var newKey = Store.addNewFighter()
			this.setState({
				fighters: Store.getFighters(),
				editingTab: parseInt(newKey.id),
			})
		} else {
			this.setState({editingTab: key})
		}
	},
	onDelete(id) {
		Store.removeFighter(id)
		this.setState({
			editingTab: parseInt(Store.fighters[0].id),
		})
		this.setState({
			fighters: Store.getFighters(),
			editingTab: parseInt(Store.fighters[0].id),
		})
	},
	/** validationの中身となるコンポーネントを作り出す */
	getValidationElements() {
		var validation = Store.validate()
		if(!validation) return null
		return validation.map((v) => {
			return <div><Glyphicon glyph="alert" /> {v}</div>
		})
	},
	// tab作成
	createPanes() {
		var panes = []
		for(var i = 0;i < this.state.fighters.length;i++) {
			panes.push(
				<TabPane
					eventKey={parseInt(this.state.fighters[i].id)}
					key={parseInt(this.state.fighters[i].id)}
					tab={<span><Glyphicon glyph="stats" /> {this.state.fighters[i].name}</span>} >
					<FighterEditor
						id={this.state.fighters[i].id}
						fighter={this.state.fighters[i]}
						disabled={this.state.inBattle}
						onChange={this.onChangeEditor}
						onDelete={this.onDelete} />
				</TabPane>
			)
		}
		console.table(this.state.fighters)
		return panes
	},
	// バトルボタン
	battleStart() {
		if(!this.canBattle() || this.state.inBattle) return
		Store.battle()
		this.setState({inBattle: true, battleText: "バトル開始！\n"})
	},
	render() {
		var text = this.state.battleText.split("\n").map((l) => {return (<span>{l}<br /></span>) })
		return <Grid fluid>
			<Row>
				<Col sm={8}>
					<TabbedArea activeKey={this.state.editingTab} onSelect={this.onFighterSelected} animation={false}
>
						{this.createPanes()}
						<TabPane eventKey={-1} tab="+" disabled={this.state.inBattle} />
					</TabbedArea>
					{this.getValidationElements() ? <Alert bsStyle="warning">{this.getValidationElements()}</Alert> : ""}
					<Button
						onClick={this.battleStart}
						bsStyle="primary"
						block
						disabled={!this.canBattle() || this.state.inBattle}
						active={this.state.inBattle}><Glyphicon glyph="knight" /> バトルボタン</Button>
				</Col>
				<Col sm={4}>
					<Panel className="resultPane" ref="resultPane" header={<span><Glyphicon glyph="headphones" /> 実況席</span>}>{text}</Panel>
				</Col>
			</Row>
		</Grid>
	},
})

var FighterEditor = React.createClass({
	onChange(e) {
		this.props.onChange(this.props.id, e.target.name, e.target.value)
	},
	onClickDelete(e) {
		this.props.onDelete(this.props.id)
	},
	render() {
		return <div>
			<Input label="名前" ref="name" name="name" type="text" bsSize="small" value={this.props.fighter.name} onChange={this.onChange} disabled={this.props.disabled} />
			<Input label="攻撃力" ref="attack" name="attack" type="text" bsSize="small" value={this.props.fighter.attack} onChange={this.onChange} disabled={this.props.disabled} />
			<Input label="防御力" ref="defense" name="defense" type="text" bsSize="small" value={this.props.fighter.defense} onChange={this.onChange} disabled={this.props.disabled} />
			<Input label="はやさ" ref="speed" name="speed" type="text" bsSize="small" value={this.props.fighter.speed} onChange={this.onChange} disabled={this.props.disabled} />
			<Input label="最大HP" ref="maxHp" name="maxHp" type="text" bsSize="small" value={this.props.fighter.maxHp} onChange={this.onChange} disabled={this.props.disabled} />
			<ConfirmButton
				onClick={this.onClickDelete}
				disabled={Store.fighters.length <= 2}>削除</ConfirmButton>
		</div>
	},
})

// コンポーネントライブラリとして切り出せそう

/**
 * 確認ボタン.
 * ほとんど通常のボタンと同様だが、二回クリックさせる.
 */
var ConfirmButton = React.createClass({
	getDefaultProps() {
		return {
			bsStyle: "default",
		}
	},
	getInitialState() {
		return {isConfirming: false}
	},
	onClick(e) {
		if(this.state.isConfirming) {
			this.setState({isConfirming: false})
			if(this.props.onClick) this.props.onClick(e)
		} else {
			this.setState({
				isConfirming: true,
			})
		}
	},
	onBlur(e) {
		this.setState({isConfirming: false})
		if(this.props.onBlur) this.props.onBlur(e)
	},
	render() {
		// 継承すべき？
		return <Button
			active={this.props.active}
			block={this.props.block}
			bsSize={this.props.bsSize}
			bsStyle={this.state.isConfirming ? "danger" : this.props.bsStyle}
			componentClass={this.props.componentClass}
			disabled={this.props.disabled}
			href={this.props.href}
			navDropdown={this.props.navDropdown}
			navItem={this.props.navItem}
			target={this.props.target}
			type={this.props.type}
			onClick={this.onClick}
			onBlur={this.onBlur}>{this.props.children}</Button>
	},
})

React.render(<Game />, document.getElementById("container"))
