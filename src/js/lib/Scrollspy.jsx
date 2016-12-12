import React from 'react'

export class Scrollspy extends React.Component {

  static get PropTypes () {
    return {
      items: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
      currentClassName: React.PropTypes.string.isRequired,
      scrolledPastClassName: React.PropTypes.string,
      style: React.PropTypes.object,
      componentTag: React.PropTypes.string,
    }
  }

  static get defaultProps () {
    return {
      items: [],
      currentClassName: '',
    }
  }

  constructor (props) {
    super(props)

    this.state = {
      targetItems: [],
      inViewState: [],
      isScrolledPast: []
    }
    // manually bind as ES6 does not apply this
    // auto binding as React.createClass does
    this._handleSpy = this._handleSpy.bind(this)
  }

  _initSpyTarget (items) {
    const targetItems = items.map((item) => {

      return document.getElementById(item)
    })

    return targetItems
  }

  _getElemsViewState (targets) {
    let elemsInView = []
    let elemsOutView = []
    let viewStatusList = []

    const targetItems = targets ? targets : this.state.targetItems

    let hasInViewAlready = false

    for (let i = 0, max = targetItems.length; i < max; i++) {
      let currentContent = targetItems[i]
      let isInView = hasInViewAlready ? false : this._isInView(currentContent)

      if (isInView) {
        hasInViewAlready = true
        elemsInView.push(currentContent)
      } else {
        elemsOutView.push(currentContent)
      }

      const isLastItem = i === max - 1
      const isScrolled = (document.documentElement.scrollTop || document.body.scrollTop) > 0

      // https://github.com/makotot/react-scrollspy/pull/26#issue-167413769
      if (this._isAtBottom() && this._isInView(currentContent) && !isInView && isLastItem && isScrolled) {
        elemsOutView.pop()
        elemsOutView.push(...elemsInView)
        elemsInView = [currentContent]
        viewStatusList.fill(false)
        isInView = true
      }

      viewStatusList.push(isInView)
    }

    return {
      inView: elemsInView,
      outView: elemsOutView,
      viewStatusList,
      scrolledPast: this._getScrolledPast(viewStatusList),
    }
  }

  _isInView (el) {
    if (!el) {
      return false
    }
    const rect = el.getBoundingClientRect()
    const winH = window.innerHeight
    const doc = document
    const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop
    const scrollBottom = scrollTop + winH
    const elTop = rect.top + scrollTop
    const elBottom = elTop + el.offsetHeight

    return (elTop < scrollBottom) && (elBottom > scrollTop)
  }

  _isAtBottom () {
    const doc = document
    const body = doc.body
    const scrollTop = (doc.documentElement && doc.documentElement.scrollTop) || body.scrollTop
    const scrollHeight = (doc.documentElement && doc.documentElement.scrollHeight) || body.scrollHeight
    const scrolledToBottom = (scrollTop + window.innerHeight) >= scrollHeight

    return scrolledToBottom
  }

  _getScrolledPast (isInView) {
    let foundInView = false

    // if no elements is in view, return original array
    if (!isInView.some((e) => e)) {
      return isInView
    }

    return isInView.map((x) => {
      // if element is in view, flip flag and return the original state
      if (x && !foundInView){
        foundInView = true
        return x
      }
      return !foundInView
    })
  }

  _spy (targets) {
    const elemensViewState = this._getElemsViewState(targets)
    this.setState({
      inViewState: elemensViewState.viewStatusList,
      isScrolledPast: elemensViewState.scrolledPast
    })
  }

  _handleSpy () {
    let timer

    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(this._spy.bind(this), 100)
  }

  _initFromProps () {
    const targetItems = this._initSpyTarget(this.props.items)

    this.setState({
      targetItems,
    })

    this._spy(targetItems)
  }

  componentDidMount () {
    this._initFromProps()
    window.addEventListener('scroll', this._handleSpy)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this._handleSpy)
  }

  componentWillReceiveProps () {
    this._initFromProps()
  }

  render () {
    const Tag = this.props.componentTag || 'ul'
    let counter = 0
    const items = React.Children.map(this.props.children, (child, idx) => {
      if (!child) {
        return null
      }

      const isScrolledPast = this.props.scrolledPastClassName && this.state.isScrolledPast[idx]

      return React.cloneElement(child, {
        className: (child.props.className ? child.props.className : '') + (this.state.inViewState[idx] ? ' ' + this.props.currentClassName : '') + (isScrolledPast ? ` ${this.props.scrolledPastClassName}` : ''),
        key: counter++,
      })
    })

    return (
      <Tag className={ this.props.className ? this.props.className : '' } style={ this.props.style }>
        { items }
      </Tag>
    )
  }
}
