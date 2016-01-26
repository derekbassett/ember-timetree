/* global jQuery, MouseEvent */
import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import fixtures from '../../helpers/fixtures';

moduleForComponent('time-tree', 'Integration | Component | time tree', {
  integration: true
});

// custom click handler to work with D3. normal jquery clicks don't work!?
jQuery.fn.d3Click = function() {
  this.each(function (i, e) {
    var $e = jQuery(e),
        position = $e.position(),
        evt;

    try { // modern browsers
      evt = new MouseEvent("click", {
        clientX: position.left,
        clientY: position.top,
        view: window,
        bubbles: true,
        cancelable: true
      });
    } catch(err) { // phantomjs you so old!
      // i have no explanation for why we need to manipulate the y position of the element before
      // we trigger the click. it took me ~1 day of debugging to find this magic "algorithm".
      // this code path works flawlessly in chrome without manipulating the y position (shrug)
      var top = position.top - 20;

      evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window,
          0, position.left, top, position.left, top,
          false, false, false, false, 0, null);
    }

    this.dispatchEvent(evt);
  });
};

test('it renders', function(assert) {
  assert.expect(2);

  this.set('content', fixtures);
  this.render(hbs`{{time-tree content=content}}`);

  assert.equal(this.$("svg .labels").text(), "OneThreeSixSevenTwoFourFiveEightNine");
  assert.equal(this.$("svg .rows .row").length, fixtures.length);
});

test('clicking on a row triggers an action', function(assert) {
  assert.expect(1);

  this.set('content', fixtures);
  this.on('clickedAction', function(row) {
    assert.equal(row, 3);
  });

  this.render(hbs`{{time-tree content=content rowClicked='clickedAction'}}`);
  this.$("svg .content .bars .bar:nth-child(2)").each(function(i, bar) {
    Ember.run(function() {
      jQuery(bar).d3Click(i); // pass the index down to the action so we can manipulate
                              // the y position for phantomjs
    });
  });
});

test('clicking on a row highlights it', function(assert) {
  this.set('content', fixtures);
  this.render(hbs`{{time-tree content=content}}`);

  assert.equal(this.$("svg .rows .row").length, 9);
  assert.equal(this.$("svg .rows .row.selected").length, 0);

  this.$("svg .content .bars .bar:nth-child(2)").each(function(i, bar) {
    Ember.run(function() {
      jQuery(bar).d3Click(i); // pass the index down to the action so we can manipulate
                              // the y position for phantomjs
    });
  });

  assert.equal(this.$("svg .rows .row.selected").length, 1);
  assert.ok(this.$("svg .rows .row:nth-child(2)").hasClass('selected'));
});

test('row highlighting can be controlled by the selection binding', function(assert) {
  this.set('content', fixtures);
  this.render(hbs`{{time-tree content=content selection=selection}}`);

  assert.equal(this.$("svg .rows .row").length, 9);
  assert.equal(this.$("svg .rows .row.selected").length, 0);

  Ember.run(this, function() {
    this.set('selection', 3);
  });

  assert.equal(this.$("svg .rows .row.selected").length, 1);
  assert.ok(this.$("svg .rows .row:nth-child(2)").hasClass('selected'));
});

test('row selection is two ways', function(assert) {
  this.set('content', fixtures);
  this.set('selection', 6);
  this.render(hbs`{{time-tree content=content selection=selection}}`);

  assert.equal(this.$("svg .rows .row").length, 9);
  assert.equal(this.$("svg .rows .row.selected").length, 1);
  assert.ok(this.$("svg .rows .row:nth-child(3)").hasClass('selected'));

  this.$("svg .content .bars .bar:nth-child(2)").each(function(i, bar) {
    Ember.run(function() {
      jQuery(bar).d3Click(i); // pass the index down to the action so we can manipulate
                              // the y position for phantomjs
    });
  });

  assert.equal(this.$("svg .rows .row.selected").length, 1);
  assert.ok(this.$("svg .rows .row:nth-child(2)").hasClass('selected'));
  assert.equal(this.get('selection'), 3);
});

test('setting selection to null removes the highlighting', function(assert) {
  this.set('content', fixtures);
  this.set('selection', 6);
  this.render(hbs`{{time-tree content=content selection=selection}}`);

  assert.equal(this.$("svg .rows .row").length, 9);
  assert.equal(this.$("svg .rows .row.selected").length, 1);
  assert.ok(this.$("svg .rows .row:nth-child(3)").hasClass('selected'));

  Ember.run(this, function() {
    this.set('selection', null);
  });

  assert.equal(this.$("svg .rows .row.selected").length, 0);
});
